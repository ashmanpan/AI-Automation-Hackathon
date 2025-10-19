import OpenAI from 'openai';
import dotenv from 'dotenv';
import { downloadFromMinIO } from '../config/minio';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const AI_GRADING_ENABLED = process.env.AI_GRADING_ENABLED === 'true';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
const MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS || '2000');

export interface AIGradingResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  detailedAnalysis: string;
  confidence: number;
}

export interface GradingCriteria {
  maxScore: number;
  exerciseTitle: string;
  exerciseDescription: string;
  exerciseType: 'coding' | 'study' | 'presentation' | 'deployment' | 'other';
  rubric?: string;
}

/**
 * Grade a submission using AI
 * @param submissionContent The submission content (code, text, etc.)
 * @param criteria Grading criteria
 * @param fileExtension File extension for context (e.g., .py, .js, .java)
 * @returns AI grading result
 */
export const gradeSubmission = async (
  submissionContent: string,
  criteria: GradingCriteria,
  fileExtension?: string
): Promise<AIGradingResult> => {
  if (!AI_GRADING_ENABLED) {
    throw new Error('AI grading is not enabled');
  }

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const prompt = buildGradingPrompt(submissionContent, criteria, fileExtension);

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert code reviewer and technical evaluator for hackathons.
Your task is to grade submissions fairly and provide constructive feedback.
Always return your response in valid JSON format with the following structure:
{
  "score": number (0-${criteria.maxScore}),
  "feedback": "string",
  "strengths": ["string"],
  "improvements": ["string"],
  "detailedAnalysis": "string",
  "confidence": number (0-1)
}`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: MAX_TOKENS,
      temperature: 0.3, // Lower temperature for more consistent grading
      response_format: { type: 'json_object' },
    });

    const result = response.choices[0].message.content;
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    const gradingResult: AIGradingResult = JSON.parse(result);

    // Validate and cap score
    gradingResult.score = Math.min(Math.max(gradingResult.score, 0), criteria.maxScore);

    return gradingResult;
  } catch (error: any) {
    console.error('AI Grading error:', error);
    throw new Error(`AI grading failed: ${error.message}`);
  }
};

/**
 * Build grading prompt based on criteria
 */
function buildGradingPrompt(
  content: string,
  criteria: GradingCriteria,
  fileExtension?: string
): string {
  let prompt = `Grade the following ${criteria.exerciseType} submission for a hackathon exercise.

Exercise: ${criteria.exerciseTitle}
Description: ${criteria.exerciseDescription}
Maximum Score: ${criteria.maxScore}
`;

  if (fileExtension) {
    prompt += `File Type: ${fileExtension}\n`;
  }

  if (criteria.rubric) {
    prompt += `\nGrading Rubric:\n${criteria.rubric}\n`;
  }

  prompt += `\n--- SUBMISSION START ---\n${content}\n--- SUBMISSION END ---\n`;

  prompt += `\nProvide a comprehensive evaluation including:
1. A score out of ${criteria.maxScore} points
2. Overall feedback summary
3. Key strengths (what was done well)
4. Areas for improvement (constructive suggestions)
5. Detailed analysis of the submission
6. Confidence level (0-1) in your grading

Consider the following aspects:
`;

  switch (criteria.exerciseType) {
    case 'coding':
      prompt += `- Code quality and structure
- Functionality and correctness
- Error handling and edge cases
- Documentation and comments
- Best practices and design patterns
- Performance considerations
- Security considerations
- Code readability`;
      break;

    case 'study':
      prompt += `- Depth of research
- Accuracy of information
- Clarity of presentation
- Citations and references
- Coverage of key topics
- Critical analysis
- Logical organization`;
      break;

    case 'presentation':
      prompt += `- Content quality and relevance
- Structure and organization
- Clarity of communication
- Visual design (if applicable)
- Supporting materials
- Conclusion and key takeaways`;
      break;

    case 'deployment':
      prompt += `- Deployment configuration
- Documentation quality
- Environment setup
- Security considerations
- Scalability
- Monitoring and logging
- Deployment strategy`;
      break;

    default:
      prompt += `- Quality of work
- Completeness
- Attention to detail
- Innovation
- Documentation`;
  }

  return prompt;
}

/**
 * Grade a file submission from MinIO
 * @param fileName File name in MinIO
 * @param criteria Grading criteria
 * @returns AI grading result
 */
export const gradeFileSubmission = async (
  fileName: string,
  criteria: GradingCriteria
): Promise<AIGradingResult> => {
  try {
    // Download file from MinIO
    const stream = await downloadFromMinIO(fileName);

    // Read file content
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const fileContent = Buffer.concat(chunks).toString('utf-8');

    // Extract file extension
    const fileExtension = path.extname(fileName);

    // Grade the content
    return await gradeSubmission(fileContent, criteria, fileExtension);
  } catch (error: any) {
    console.error('File grading error:', error);
    throw new Error(`Failed to grade file: ${error.message}`);
  }
};

/**
 * Batch grade multiple submissions
 * @param submissions Array of submissions to grade
 * @param criteria Grading criteria
 * @returns Array of grading results
 */
export const batchGradeSubmissions = async (
  submissions: Array<{ id: number; content: string; fileExtension?: string }>,
  criteria: GradingCriteria
): Promise<Array<{ id: number; result: AIGradingResult }>> => {
  const results: Array<{ id: number; result: AIGradingResult }> = [];

  for (const submission of submissions) {
    try {
      const result = await gradeSubmission(
        submission.content,
        criteria,
        submission.fileExtension
      );
      results.push({ id: submission.id, result });

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error(`Failed to grade submission ${submission.id}:`, error);
      // Continue with other submissions
    }
  }

  return results;
};

/**
 * Analyze code for specific issues
 * @param code Code to analyze
 * @param language Programming language
 * @returns Analysis result
 */
export const analyzeCode = async (
  code: string,
  language: string
): Promise<{
  bugs: string[];
  securityIssues: string[];
  performanceIssues: string[];
  styleIssues: string[];
}> => {
  if (!AI_GRADING_ENABLED) {
    throw new Error('AI grading is not enabled');
  }

  try {
    const prompt = `Analyze the following ${language} code and identify:
1. Potential bugs or errors
2. Security vulnerabilities
3. Performance issues
4. Style and best practice violations

Return your analysis in JSON format:
{
  "bugs": ["list of bugs"],
  "securityIssues": ["list of security issues"],
  "performanceIssues": ["list of performance issues"],
  "styleIssues": ["list of style issues"]
}

Code:
\`\`\`${language}
${code}
\`\`\`
`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert code analyzer and security auditor.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: MAX_TOKENS,
      response_format: { type: 'json_object' },
    });

    const result = response.choices[0].message.content;
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(result);
  } catch (error: any) {
    console.error('Code analysis error:', error);
    throw new Error(`Code analysis failed: ${error.message}`);
  }
};

/**
 * Check if AI grading is available
 * @returns Boolean indicating if AI grading is enabled and configured
 */
export const isAIGradingAvailable = (): boolean => {
  return (
    AI_GRADING_ENABLED &&
    !!process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== 'your_openai_api_key_here'
  );
};

export default {
  gradeSubmission,
  gradeFileSubmission,
  batchGradeSubmissions,
  analyzeCode,
  isAIGradingAvailable,
};
