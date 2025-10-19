# MinIO Storage & AI Grading Guide

## Overview

This guide covers the new MinIO/S3 storage integration and AI-powered grading system for the Hackathon Platform.

---

## Table of Contents

1. [MinIO Setup](#minio-setup)
2. [AI Grading Setup](#ai-grading-setup)
3. [File Upload with MinIO](#file-upload-with-minio)
4. [AI Grading API](#ai-grading-api)
5. [Configuration](#configuration)
6. [Troubleshooting](#troubleshooting)

---

## MinIO Setup

### What is MinIO?

MinIO is an S3-compatible object storage server. It's perfect for storing uploaded files (code, presentations, documents) in a scalable, distributed manner.

### Quick Start with Docker

1. **Start MinIO using Docker Compose:**

```bash
# Start MinIO and PostgreSQL
docker-compose up -d minio postgres

# Check if MinIO is running
docker ps
```

2. **Access MinIO Console:**
   - Open browser: `http://localhost:9001`
   - Username: `minioadmin`
   - Password: `minioadmin`

3. **Verify Bucket Creation:**
   - The backend automatically creates a `hackathon-files` bucket on startup
   - You can see it in the MinIO console

### Manual MinIO Installation

If you prefer to install MinIO manually:

```bash
# Linux/Mac
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
./minio server /data --console-address ":9001"

# Windows (PowerShell)
Invoke-WebRequest -Uri "https://dl.min.io/server/minio/release/windows-amd64/minio.exe" -OutFile "minio.exe"
./minio.exe server C:\data --console-address ":9001"
```

### Environment Configuration

Update `backend/.env`:

```env
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=hackathon-files

# Set to false to use local storage instead
USE_MINIO=true
```

---

## AI Grading Setup

### Prerequisites

1. **OpenAI API Key**: Get one from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Credits**: Ensure your OpenAI account has sufficient credits

### Configuration

Update `backend/.env`:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=2000

# AI Grading Settings
AI_GRADING_ENABLED=true
AI_GRADING_AUTO=false  # Set to true for automatic grading
```

### Supported Models

- `gpt-4-turbo-preview` - Best quality (recommended)
- `gpt-4` - High quality
- `gpt-3.5-turbo` - Faster, lower cost

### Cost Estimation

**Approximate costs per submission (GPT-4 Turbo):**
- Small code file (< 500 lines): $0.02 - $0.05
- Medium code file (500-2000 lines): $0.05 - $0.15
- Large code file (> 2000 lines): $0.15 - $0.30

For 100 participants:
- Budget: $5 - $30 depending on submission sizes

---

## File Upload with MinIO

### Upload Flow

1. **Team uploads file** → Multer temporary storage
2. **Backend uploads to MinIO** → Gets presigned URL
3. **URL stored in database** → Accessible for 7 days
4. **Temporary file deleted** → Saves local disk space

### Supported File Types

- **Code**: `.js`, `.ts`, `.py`, `.java`, `.cpp`, `.c`, `.go`, `.rb`, `.php`
- **Documents**: `.pdf`, `.doc`, `.docx`, `.txt`, `.md`
- **Archives**: `.zip`, `.tar`, `.gz`
- **Presentations**: `.ppt`, `.pptx`
- **Images**: `.png`, `.jpg`, `.jpeg` (for diagrams, screenshots)

### Upload Example

```bash
# Upload code file
curl -X POST http://localhost:5000/api/submissions \
  -H "Authorization: Bearer $TOKEN" \
  -F "team_exercise_id=1" \
  -F "submission_type=file" \
  -F "file=@solution.py"

# Response includes file URL
{
  "id": 1,
  "team_exercise_id": 1,
  "submission_type": "file",
  "file_path": "submissions/1234567890-solution.py",
  "file_url": "http://localhost:9000/hackathon-files/submissions/1234567890-solution.py?X-Amz-..."
}
```

### File Access

Files are accessible via presigned URLs that expire after 7 days. To regenerate:

```javascript
// Backend code
const { getFileUrl } = require('./services/fileStorageService');
const newUrl = await getFileUrl(fileName, 7 * 24 * 60 * 60); // 7 days
```

---

## AI Grading API

### 1. Check AI Grading Status

```bash
curl -X GET http://localhost:5000/api/ai-grading/status \
  -H "Authorization: Bearer $TOKEN"

# Response
{
  "available": true,
  "message": "AI grading is enabled and configured"
}
```

### 2. Grade Single Submission

```bash
curl -X POST http://localhost:5000/api/ai-grading/grade \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "submission_id": 1
  }'

# Response
{
  "success": true,
  "grade": {
    "id": 1,
    "submission_id": 1,
    "score": 85.5,
    "feedback": "AI Grading Result:\n\nWell-structured code with good error handling...",
    "graded_by": 1,
    "graded_at": "2024-01-15T10:30:00Z"
  },
  "aiResult": {
    "score": 85.5,
    "feedback": "Overall excellent implementation with minor improvements needed",
    "strengths": [
      "Clean code structure",
      "Comprehensive error handling",
      "Good documentation"
    ],
    "improvements": [
      "Add input validation",
      "Consider edge cases"
    ],
    "detailedAnalysis": "The solution demonstrates...",
    "confidence": 0.92
  }
}
```

### 3. Batch Grade Multiple Submissions

Grade all ungraded submissions for an exercise:

```bash
curl -X POST http://localhost:5000/api/ai-grading/batch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exercise_id": 1
  }'

# Response
{
  "success": true,
  "total": 25,
  "graded": 24,
  "failed": 1
}
```

**Note**: Batch grading includes 1-second delays between requests to avoid rate limiting.

### 4. Analyze Code

Get detailed code analysis without grading:

```bash
curl -X POST http://localhost:5000/api/ai-grading/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "submission_id": 1
  }'

# Response
{
  "success": true,
  "submission_id": 1,
  "language": "python",
  "analysis": {
    "bugs": [
      "Potential null pointer dereference at line 45",
      "Off-by-one error in loop at line 67"
    ],
    "securityIssues": [
      "SQL injection vulnerability in query at line 23",
      "Missing input sanitization"
    ],
    "performanceIssues": [
      "O(n²) algorithm could be optimized to O(n log n)",
      "Unnecessary database queries in loop"
    ],
    "styleIssues": [
      "Inconsistent naming convention",
      "Missing docstrings for public methods"
    ]
  }
}
```

### 5. Re-grade Submission

Re-grade a submission (deletes previous AI grades):

```bash
curl -X POST http://localhost:5000/api/ai-grading/regrade \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "submission_id": 1
  }'
```

### 6. Get Grading Statistics

```bash
curl -X GET "http://localhost:5000/api/ai-grading/stats?hackathon_id=1" \
  -H "Authorization: Bearer $TOKEN"

# Response
{
  "total_submissions": 50,
  "graded_submissions": 35,
  "ungraded_submissions": 15,
  "ai_available": true
}
```

---

## Grading Criteria

### Exercise Types

AI grading adapts based on exercise type:

#### 1. **Coding Exercises**

Evaluates:
- Code quality and structure
- Functionality and correctness
- Error handling
- Documentation
- Best practices
- Performance
- Security

#### 2. **Study/Research**

Evaluates:
- Depth of research
- Accuracy of information
- Clarity and organization
- Citations
- Critical analysis

#### 3. **Presentations**

Evaluates:
- Content quality
- Structure
- Clarity
- Visual design
- Conclusions

#### 4. **Deployment**

Evaluates:
- Configuration quality
- Documentation
- Environment setup
- Security
- Scalability

### Custom Rubrics

You can provide custom grading rubrics when creating exercises:

```javascript
// When creating exercise
{
  "title": "Build REST API",
  "type": "coding",
  "max_score": 100,
  "rubric": `
    Scoring:
    - API Endpoints (30 points): All CRUD operations implemented
    - Authentication (20 points): Secure JWT implementation
    - Error Handling (20 points): Comprehensive error responses
    - Documentation (15 points): API docs and comments
    - Testing (15 points): Unit and integration tests
  `
}
```

---

## Configuration

### Complete Environment Variables

```env
# Server
PORT=5000
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hackathon_platform
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h

# File Upload
MAX_FILE_SIZE=10485760  # 10MB

# MinIO/S3
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=hackathon-files
USE_MINIO=true  # Set to false for local storage

# OpenAI
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=2000

# AI Grading
AI_GRADING_ENABLED=true
AI_GRADING_AUTO=false
```

---

## Workflow Examples

### Complete Hackathon Workflow with AI

```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# 3. Create hackathon
HACKATHON_ID=1

# 4. Import participants
curl -X POST http://localhost:5000/api/users/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@participants.csv"

# 5. Create teams and assign members
# ... (same as before)

# 6. Create coding exercise
EXERCISE_ID=$(curl -s -X POST http://localhost:5000/api/exercises \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hackathon_id": 1,
    "title": "Build REST API",
    "type": "coding",
    "max_score": 100,
    "time_limit_minutes": 120,
    "assign_to": "all"
  }' | jq -r '.id')

# 7. Team submits code (from participant perspective)
PARTICIPANT_TOKEN="..."
curl -X POST http://localhost:5000/api/submissions \
  -H "Authorization: Bearer $PARTICIPANT_TOKEN" \
  -F "team_exercise_id=1" \
  -F "submission_type=file" \
  -F "file=@my_solution.py"

# 8. AI grades the submission
curl -X POST http://localhost:5000/api/ai-grading/batch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"exercise_id": 1}'

# 9. View leaderboard (automatically updated)
curl "http://localhost:5000/api/leaderboard?hackathon_id=1&detailed=true" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Troubleshooting

### MinIO Issues

#### "Connection refused" error

```bash
# Check if MinIO is running
docker ps | grep minio

# Check MinIO logs
docker logs hackathon-minio

# Restart MinIO
docker-compose restart minio
```

#### Bucket not created

```bash
# Check backend logs for MinIO initialization
# The backend auto-creates the bucket on startup

# Manually create bucket using MinIO console
# http://localhost:9001 → Buckets → Create Bucket → "hackathon-files"
```

#### Upload fails

```bash
# Check .env configuration
# Ensure MINIO_ENDPOINT matches your setup
# For Docker: MINIO_ENDPOINT=minio
# For local: MINIO_ENDPOINT=localhost

# Test MinIO connection
curl http://localhost:9000/minio/health/live
```

### AI Grading Issues

#### "AI grading is not available"

```bash
# 1. Check if OpenAI API key is set
echo $OPENAI_API_KEY

# 2. Verify in .env file
cat backend/.env | grep OPENAI_API_KEY

# 3. Check if AI grading is enabled
curl http://localhost:5000/api/ai-grading/status \
  -H "Authorization: Bearer $TOKEN"
```

#### "Insufficient credits" error

- Your OpenAI account needs credits
- Add payment method at https://platform.openai.com/account/billing

#### "Rate limit exceeded"

- OpenAI has rate limits (typically 3-5 requests/minute for new accounts)
- Use batch grading with delays
- Upgrade your OpenAI account tier

#### Grading takes too long

```env
# Reduce token limit for faster responses
OPENAI_MAX_TOKENS=1000

# Use faster model
OPENAI_MODEL=gpt-3.5-turbo
```

### Storage Fallback

If MinIO fails, the system automatically falls back to local storage:

```bash
# Check which storage is being used
curl http://localhost:5000/api/health

# Force local storage
# In .env:
USE_MINIO=false
```

---

## Security Best Practices

### MinIO in Production

```yaml
# docker-compose.yml for production
environment:
  MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}  # Use secrets
  MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}  # Use secrets

# Enable SSL
volumes:
  - ./certs:/root/.minio/certs
```

### OpenAI API Key

```bash
# Never commit API keys to git
echo ".env" >> .gitignore

# Use environment variables in production
export OPENAI_API_KEY=sk-your-key-here

# Or use secrets management (AWS Secrets Manager, HashiCorp Vault, etc.)
```

### File Upload Limits

```env
# Restrict file sizes
MAX_FILE_SIZE=10485760  # 10MB

# Restrict file types (in code)
const allowedTypes = ['.py', '.js', '.java', '.cpp'];
```

---

## Performance Optimization

### MinIO Performance

```yaml
# Increase MinIO workers
command: server /data --console-address ":9001" --workers 8

# Use distributed mode for production
command: server http://minio{1...4}/data{1...2} --console-address ":9001"
```

### AI Grading Performance

```javascript
// Parallel grading (with rate limit awareness)
const gradeInBatches = async (submissions, batchSize = 3) => {
  for (let i = 0; i < submissions.length; i += batchSize) {
    const batch = submissions.slice(i, i + batchSize);
    await Promise.all(batch.map(s => gradeSubmission(s)));
    await delay(1000); // Rate limit protection
  }
};
```

---

## Monitoring & Logging

### MinIO Metrics

```bash
# Check MinIO metrics
curl http://localhost:9000/minio/v2/metrics/cluster

# Monitor storage usage
docker exec hackathon-minio mc du myminio/hackathon-files
```

### AI Grading Metrics

```javascript
// Track grading stats
const stats = {
  total_graded: 0,
  avg_score: 0,
  avg_confidence: 0,
  total_cost: 0, // Estimate based on tokens used
};
```

---

## Next Steps

1. **Test the Setup**:
   ```bash
   npm run dev
   # Upload a file
   # Try AI grading
   ```

2. **Customize Grading**: Modify `aiGradingService.ts` to adjust prompts

3. **Scale Up**: Use distributed MinIO and increase OpenAI rate limits

4. **Monitor Costs**: Track OpenAI API usage in your dashboard

---

## Support

For issues:
- MinIO: https://min.io/docs
- OpenAI: https://platform.openai.com/docs
- Project Issues: GitHub repository

---

**Happy Grading! 🚀🤖**
