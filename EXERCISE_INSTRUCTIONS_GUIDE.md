# Exercise Instructions & User Guide Feature

## Overview

Every exercise now supports **structured step-by-step instructions** to guide participants through the task. This feature ensures participants know exactly what to do and reduces confusion.

---

## Database Changes

### New Fields in `exercises` Table

1. **`instructions`** (TEXT, nullable)
   - Step-by-step user guide for participants
   - Can be formatted as Markdown or plain text
   - Displayed to participants when they view the exercise

2. **`rubric`** (TEXT, nullable)
   - Grading criteria and evaluation rubric
   - Used by judges for manual grading
   - Used by AI for automated grading
   - Ensures consistent evaluation

### Running the Migration

```bash
# If using Docker PostgreSQL
docker exec -i hackathon-postgres psql -U postgres -d hackathon_platform < database/migrations/002_add_exercise_instructions.sql

# If using local PostgreSQL
psql -U postgres -d hackathon_platform < database/migrations/002_add_exercise_instructions.sql

# Or connect and run manually
psql -U postgres -d hackathon_platform
\i database/migrations/002_add_exercise_instructions.sql
```

---

## API Usage

### Creating Exercise with Instructions

**Endpoint**: `POST /api/exercises`

**Request Body**:
```json
{
  "hackathon_id": 1,
  "title": "Build a REST API",
  "description": "Create a RESTful API with authentication, CRUD operations, and proper error handling.",
  "instructions": "# Step-by-Step Guide\n\n## Step 1: Setup Your Environment\n- Install Node.js 18+\n- Create a new project: `npm init`\n- Install dependencies: `npm install express jsonwebtoken bcryptjs`\n\n## Step 2: Create Project Structure\n```\nproject/\n├── src/\n│   ├── routes/\n│   ├── controllers/\n│   ├── models/\n│   └── middleware/\n└── server.js\n```\n\n## Step 3: Implement Authentication\n- Create user registration endpoint\n- Implement login with JWT\n- Add authentication middleware\n\n## Step 4: Build CRUD Endpoints\n- GET /api/items - List all items\n- POST /api/items - Create new item\n- PUT /api/items/:id - Update item\n- DELETE /api/items/:id - Delete item\n\n## Step 5: Add Error Handling\n- Implement global error handler\n- Add input validation\n- Return proper HTTP status codes\n\n## Step 6: Test Your API\n- Use Postman or curl to test\n- Verify all endpoints work\n- Check error handling\n\n## Step 7: Submit\n- Zip your project folder\n- Upload through the submission form\n- Include a README with setup instructions",
  "rubric": "# Grading Rubric (100 points)\n\n## API Endpoints (30 points)\n- All CRUD operations implemented (20 pts)\n- Proper HTTP methods used (5 pts)\n- RESTful URL structure (5 pts)\n\n## Authentication (20 points)\n- User registration works (5 pts)\n- Login returns JWT token (10 pts)\n- Protected routes verify token (5 pts)\n\n## Error Handling (20 points)\n- Global error handler implemented (10 pts)\n- Input validation on all endpoints (5 pts)\n- Proper HTTP status codes (5 pts)\n\n## Code Quality (15 points)\n- Clean code structure (5 pts)\n- Proper naming conventions (5 pts)\n- Comments where needed (5 pts)\n\n## Documentation (10 points)\n- README with setup instructions (5 pts)\n- API endpoint documentation (5 pts)\n\n## Testing (5 points)\n- Evidence of testing (5 pts)",
  "type": "coding",
  "max_score": 100,
  "time_limit_minutes": 180,
  "assign_to": "all"
}
```

**Response**:
```json
{
  "id": 1,
  "hackathon_id": 1,
  "title": "Build a REST API",
  "description": "Create a RESTful API with authentication...",
  "instructions": "# Step-by-Step Guide\n\n## Step 1: Setup...",
  "rubric": "# Grading Rubric (100 points)...",
  "type": "coding",
  "max_score": 100,
  "time_limit_minutes": 180,
  "status": "draft",
  "created_at": "2024-03-15T10:00:00Z"
}
```

### Updating Exercise Instructions

**Endpoint**: `PUT /api/exercises/:id`

**Request Body**:
```json
{
  "instructions": "# Updated Instructions\n\nNew step-by-step guide...",
  "rubric": "# Updated Rubric\n\nNew grading criteria..."
}
```

### Getting Exercise (Participant View)

**Endpoint**: `GET /api/exercises?team_id=3`

**Response** (includes instructions):
```json
{
  "exercises": [
    {
      "id": 1,
      "title": "Build a REST API",
      "description": "Create a RESTful API...",
      "instructions": "# Step-by-Step Guide\n\n## Step 1...",
      "type": "coding",
      "max_score": 100,
      "time_limit_minutes": 180,
      "status": "active",
      "team_exercise_id": 1,
      "assignment_status": "assigned"
    }
  ]
}
```

---

## Example Instructions Templates

### Template 1: Coding Exercise

```markdown
# Step-by-Step Guide: Build a Todo App

## Prerequisites
- Node.js 18+ installed
- Basic JavaScript knowledge
- Text editor (VS Code recommended)

## Step 1: Project Setup (10 minutes)
1. Create project directory:
   ```bash
   mkdir todo-app
   cd todo-app
   npm init -y
   ```

2. Install dependencies:
   ```bash
   npm install express body-parser
   npm install --save-dev nodemon
   ```

3. Create folder structure:
   ```
   todo-app/
   ├── src/
   │   ├── app.js
   │   └── routes/
   │       └── todos.js
   ├── data/
   │   └── todos.json
   └── package.json
   ```

## Step 2: Create Express Server (15 minutes)
1. Create `src/app.js`:
   ```javascript
   const express = require('express');
   const bodyParser = require('body-parser');
   const app = express();

   app.use(bodyParser.json());

   // TODO: Add routes here

   app.listen(3000, () => {
     console.log('Server running on port 3000');
   });
   ```

2. Test server:
   ```bash
   node src/app.js
   ```
   Should see: "Server running on port 3000"

## Step 3: Implement Todo Routes (30 minutes)

### GET /todos - List all todos
```javascript
app.get('/todos', (req, res) => {
  // Read from data/todos.json
  // Return array of todos
});
```

### POST /todos - Create new todo
```javascript
app.post('/todos', (req, res) => {
  // Validate input
  // Add to todos.json
  // Return created todo
});
```

### PUT /todos/:id - Update todo
```javascript
app.put('/todos/:id', (req, res) => {
  // Find todo by id
  // Update fields
  // Save to todos.json
});
```

### DELETE /todos/:id - Delete todo
```javascript
app.delete('/todos/:id', (req, res) => {
  // Find and remove todo
  // Return success message
});
```

## Step 4: Add Validation (15 minutes)
- Check required fields (title, description)
- Validate data types
- Return 400 Bad Request for invalid data

## Step 5: Error Handling (10 minutes)
- Add try-catch blocks
- Handle file read/write errors
- Return proper status codes (200, 201, 400, 404, 500)

## Step 6: Testing (20 minutes)
Test each endpoint with curl:

```bash
# Create todo
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Node.js","description":"Complete the tutorial"}'

# Get all todos
curl http://localhost:3000/todos

# Update todo
curl -X PUT http://localhost:3000/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Delete todo
curl -X DELETE http://localhost:3000/todos/1
```

## Step 7: Documentation (10 minutes)
Create README.md with:
- Setup instructions
- API endpoints documentation
- Example requests/responses

## Step 8: Submission
1. Zip your project folder
2. Include README.md
3. Upload through submission form

## Common Issues & Solutions

**Issue**: Port 3000 already in use
**Solution**: Change port or kill existing process

**Issue**: Cannot read todos.json
**Solution**: Ensure data/ folder exists

**Issue**: JSON parse error
**Solution**: Check JSON syntax in todos.json

## Evaluation Criteria
Your submission will be graded on:
- Functionality (40%) - All endpoints work correctly
- Code Quality (30%) - Clean, organized code
- Error Handling (20%) - Proper error responses
- Documentation (10%) - Clear README
```

### Template 2: Research/Study Exercise

```markdown
# Step-by-Step Guide: Research AI Ethics

## Objective
Research and document ethical considerations in AI development.

## Step 1: Topic Selection (15 minutes)
Choose ONE of these topics:
- Bias in AI algorithms
- Privacy concerns with AI
- AI job displacement
- Autonomous weapons ethics
- AI in healthcare decisions

## Step 2: Research (60 minutes)

### Find 5-7 Credible Sources
Look for:
- Academic papers (Google Scholar)
- Industry reports
- News articles from reputable sources
- Expert interviews

### Take Notes on:
- Key facts and statistics
- Different perspectives
- Real-world examples
- Expert opinions

## Step 3: Structure Your Report (15 minutes)

Create outline:
1. Introduction
   - Topic overview
   - Why it matters
2. Background
   - History
   - Current state
3. Key Issues
   - Problem 1
   - Problem 2
   - Problem 3
4. Different Perspectives
   - Viewpoint A
   - Viewpoint B
5. Real-World Examples
   - Case study 1
   - Case study 2
6. Conclusion
   - Summary
   - Your analysis

## Step 4: Write Report (90 minutes)

### Introduction (200-300 words)
- Hook the reader
- Introduce your topic
- State your thesis

### Body Sections (1500-2000 words)
- One paragraph = one idea
- Use evidence from sources
- Cite sources properly

### Conclusion (200-300 words)
- Summarize key points
- Your critical analysis
- Future implications

## Step 5: Citations (30 minutes)
Add citations in APA format:

```
Author, A. A. (Year). Title of article. Journal Name, volume(issue), pages.
```

Example:
```
Smith, J. (2023). Bias in AI Algorithms: A Critical Analysis. AI Ethics Journal, 15(2), 45-67.
```

## Step 6: Review & Edit (30 minutes)
Check for:
- Grammar and spelling
- Logical flow
- Evidence supports claims
- Proper citations
- Word count (2000-2500 words)

## Step 7: Format Document
- Font: Times New Roman, 12pt
- Spacing: Double-spaced
- Margins: 1 inch all sides
- Header: Name, Date, Topic
- Page numbers

## Step 8: Submit
- Save as PDF
- File name: YourName_AIEthics.pdf
- Upload through submission form

## Resources
- Google Scholar: scholar.google.com
- IEEE Xplore: ieeexplore.ieee.org
- ArXiv: arxiv.org
- MIT Technology Review: technologyreview.com

## Evaluation Rubric
- Research Depth (25%) - Multiple quality sources
- Analysis Quality (25%) - Critical thinking
- Organization (20%) - Clear structure
- Writing Quality (15%) - Grammar, clarity
- Citations (15%) - Proper format
```

### Template 3: Deployment Exercise

```markdown
# Step-by-Step Guide: Deploy to AWS/Heroku

## Objective
Deploy your application to the cloud and provide a live URL.

## Prerequisites
- Working application (from previous exercise)
- Git installed
- GitHub account
- AWS/Heroku account

## Option A: Deploy to Heroku

### Step 1: Install Heroku CLI (5 minutes)
```bash
# macOS
brew install heroku/brew/heroku

# Windows
# Download from heroku.com/install

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

### Step 2: Login to Heroku (2 minutes)
```bash
heroku login
```

### Step 3: Prepare Your App (10 minutes)

1. Create `Procfile` in root:
   ```
   web: node src/server.js
   ```

2. Update `package.json`:
   ```json
   {
     "scripts": {
       "start": "node src/server.js"
     },
     "engines": {
       "node": "18.x"
     }
   }
   ```

3. Set port from environment:
   ```javascript
   const PORT = process.env.PORT || 3000;
   ```

### Step 4: Create Heroku App (5 minutes)
```bash
heroku create your-app-name
```

### Step 5: Deploy (5 minutes)
```bash
git add .
git commit -m "Prepare for Heroku deployment"
git push heroku main
```

### Step 6: Open App (1 minute)
```bash
heroku open
```

Copy the URL (https://your-app-name.herokuapp.com)

### Step 7: Check Logs (if needed)
```bash
heroku logs --tail
```

## Option B: Deploy to AWS Elastic Beanstalk

### Step 1: Install EB CLI (5 minutes)
```bash
pip install awsebcli --upgrade --user
```

### Step 2: Initialize EB (10 minutes)
```bash
eb init

# Answer prompts:
# - Region: us-east-1
# - Application name: your-app
# - Platform: Node.js 18
# - SSH: Yes
```

### Step 3: Create Environment (15 minutes)
```bash
eb create production

# Wait for deployment (5-10 minutes)
```

### Step 4: Open Application (1 minute)
```bash
eb open
```

Copy the URL

### Step 5: View Logs (if needed)
```bash
eb logs
```

## Step 8: Test Deployed App (10 minutes)

Test all endpoints:
```bash
# Replace URL with your deployment URL

# Health check
curl https://your-app.herokuapp.com/health

# Test API endpoints
curl https://your-app.herokuapp.com/api/todos

# Test with data
curl -X POST https://your-app.herokuapp.com/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Testing deployed app"}'
```

## Step 9: Create Documentation (20 minutes)

Create `DEPLOYMENT.md`:
```markdown
# Deployment Information

## Live URL
https://your-app.herokuapp.com

## Deployment Platform
Heroku / AWS Elastic Beanstalk

## Deployment Date
[Date]

## Environment Variables
- PORT: Set by platform
- NODE_ENV: production

## Testing the Deployment
[Instructions for testing your deployed app]

## Troubleshooting
[Common issues you encountered and solutions]
```

## Step 10: Submit
Submit your:
1. Live URL
2. DEPLOYMENT.md file
3. Screenshots of working app

## Common Issues & Solutions

**Issue**: App crashes on startup
**Solution**: Check logs, ensure PORT is from environment

**Issue**: Database connection error
**Solution**: Use environment variables, not localhost

**Issue**: Static files not loading
**Solution**: Configure correct paths for production

## Evaluation Criteria
- Deployment Success (40%) - App is live and accessible
- Functionality (30%) - All features work correctly
- Documentation (20%) - Clear deployment docs
- Best Practices (10%) - Environment variables, error handling
```

### Template 4: Presentation Exercise

```markdown
# Step-by-Step Guide: Create Project Pitch Deck

## Objective
Create a professional presentation pitching your hackathon project.

## Step 1: Plan Your Story (20 minutes)

Answer these questions:
- What problem does your project solve?
- Who is your target user?
- What makes your solution unique?
- How does it work?
- What's the impact?

## Step 2: Structure Your Deck (10 minutes)

**Slide 1: Title**
- Project name
- Team name
- Tagline (one sentence)

**Slide 2: The Problem**
- What problem exists?
- Who is affected?
- Why does it matter?

**Slide 3: Solution Overview**
- Your solution in 2-3 sentences
- Key features
- How it helps

**Slide 4: How It Works**
- Architecture diagram
- User flow
- Technology stack

**Slide 5: Demo**
- Screenshots or video
- Key functionality
- User experience

**Slide 6: Impact**
- Who benefits?
- How many users?
- Measurable impact

**Slide 7: Technical Highlights**
- Interesting technical challenges
- Innovative approaches
- Technologies used

**Slide 8: Future Plans**
- Next features
- Scaling plans
- Timeline

**Slide 9: Team**
- Team members and roles
- Why you're qualified

**Slide 10: Thank You**
- Contact information
- Call to action

## Step 3: Design Slides (60 minutes)

### Design Principles
- One main idea per slide
- Minimal text (6 words per line, 6 lines max)
- Use visuals (images, diagrams, charts)
- Consistent color scheme
- Large, readable fonts (30pt minimum)

### Tools
- Google Slides (recommended for collaboration)
- PowerPoint
- Canva
- Keynote

### Visual Elements
- Use high-quality images
- Create simple diagrams
- Show screenshots of your app
- Include your logo

## Step 4: Write Content (40 minutes)

### Title Slide
- Project name in large font
- Compelling tagline
- Team logo

### Content Slides
- Headlines, not sentences
- Bullet points (3-5 per slide)
- Support with visuals

### Demo Slide
- Full-screen screenshot
- Arrows pointing to key features
- Or embed short video (< 1 minute)

## Step 5: Create Speaker Notes (20 minutes)

For each slide, write what you'll say:
- Key points to mention
- Stories or examples
- Transition to next slide

## Step 6: Practice Presentation (30 minutes)

- Time yourself (should be 3-5 minutes)
- Practice transitions
- Rehearse demo
- Get feedback from teammate

## Step 7: Final Touches (20 minutes)

### Check:
- Spelling and grammar
- Image quality
- Consistent fonts and colors
- Page numbers
- Team name on all slides

### Export:
- PDF format (required)
- PowerPoint/Keynote (optional)

## Step 8: Submit
Upload:
1. PDF of presentation
2. PowerPoint/Keynote file (optional)
3. Any demo videos (optional)

## Design Tips

### Color Schemes
- Use 2-3 main colors
- Ensure good contrast (dark text on light background)
- Stick to your brand colors

### Fonts
- Heading: 44pt+
- Body: 30pt+
- Use max 2 font families

### Images
- Use free image sites: Unsplash, Pexels
- Ensure images are high resolution
- Don't use cheesy stock photos

### Layout
- Leave whitespace
- Align elements consistently
- Use grids

## Common Mistakes to Avoid
- Too much text
- Reading slides word-for-word
- Poor image quality
- Inconsistent design
- No clear message
- Going over time limit

## Evaluation Criteria
- Content Quality (30%) - Clear, compelling story
- Design (25%) - Professional, visual appeal
- Technical Explanation (20%) - Clear how it works
- Impact (15%) - Shows value and potential
- Presentation Skills (10%) - Delivery and timing
```

---

## Frontend Implementation

### Displaying Instructions to Participants

When participants view an exercise, show the instructions in a clear, formatted way:

```typescript
// React component example
import ReactMarkdown from 'react-markdown';

interface Exercise {
  id: number;
  title: string;
  description: string;
  instructions: string;
  type: string;
  max_score: number;
  time_limit_minutes: number;
}

const ExerciseDetail: React.FC<{ exercise: Exercise }> = ({ exercise }) => {
  return (
    <div className="exercise-detail">
      <h1>{exercise.title}</h1>

      <div className="exercise-meta">
        <span>Type: {exercise.type}</span>
        <span>Max Score: {exercise.max_score}</span>
        <span>Time Limit: {exercise.time_limit_minutes} minutes</span>
      </div>

      <div className="exercise-description">
        <h2>Description</h2>
        <p>{exercise.description}</p>
      </div>

      {exercise.instructions && (
        <div className="exercise-instructions">
          <h2>📋 Step-by-Step Guide</h2>
          <ReactMarkdown>{exercise.instructions}</ReactMarkdown>
        </div>
      )}

      <button className="start-button">Start Exercise</button>
    </div>
  );
};
```

### Admin Exercise Creation Form

```typescript
const ExerciseForm: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    rubric: '',
    type: 'coding',
    max_score: 100,
    time_limit_minutes: 120
  });

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Exercise Title"
        value={formData.title}
        onChange={e => setFormData({...formData, title: e.target.value})}
      />

      <textarea
        placeholder="Description (brief overview)"
        value={formData.description}
        onChange={e => setFormData({...formData, description: e.target.value})}
        rows={3}
      />

      <textarea
        placeholder="Step-by-step instructions (supports Markdown)"
        value={formData.instructions}
        onChange={e => setFormData({...formData, instructions: e.target.value})}
        rows={15}
      />

      <textarea
        placeholder="Grading rubric (for judges and AI)"
        value={formData.rubric}
        onChange={e => setFormData({...formData, rubric: e.target.value})}
        rows={10}
      />

      <select
        value={formData.type}
        onChange={e => setFormData({...formData, type: e.target.value})}
      >
        <option value="coding">Coding</option>
        <option value="study">Study/Research</option>
        <option value="presentation">Presentation</option>
        <option value="deployment">Deployment</option>
      </select>

      <input
        type="number"
        placeholder="Max Score"
        value={formData.max_score}
        onChange={e => setFormData({...formData, max_score: parseInt(e.target.value)})}
      />

      <input
        type="number"
        placeholder="Time Limit (minutes)"
        value={formData.time_limit_minutes}
        onChange={e => setFormData({...formData, time_limit_minutes: parseInt(e.target.value)})}
      />

      <button type="submit">Create Exercise</button>
    </form>
  );
};
```

---

## Benefits

### For Participants
✅ **Clear guidance**: Know exactly what to do
✅ **Reduced confusion**: Step-by-step breakdown
✅ **Better time management**: See all steps upfront
✅ **Higher quality submissions**: Follow best practices

### For Organizers
✅ **Consistent experience**: All teams have same information
✅ **Fewer questions**: Clear instructions reduce support burden
✅ **Better submissions**: Participants follow guidelines
✅ **Easier grading**: Clear rubric for evaluation

### For Judges
✅ **Consistent grading**: Use provided rubric
✅ **Clear expectations**: Know what to look for
✅ **Faster evaluation**: Structured criteria

### For AI Grading
✅ **Better accuracy**: Rubric guides evaluation
✅ **Consistent scoring**: Same criteria for all
✅ **Detailed feedback**: Based on rubric points

---

## Best Practices

### Writing Instructions

1. **Be specific**: Don't say "create an API", say "create POST /api/todos endpoint that accepts title and description"

2. **Include examples**: Show code snippets, curl commands, expected outputs

3. **Break into steps**: Each step should be completable in 10-30 minutes

4. **Provide resources**: Link to documentation, tutorials, tools

5. **Anticipate issues**: Include common problems and solutions

6. **Use formatting**: Headers, bullet points, code blocks for clarity

7. **Add checkpoints**: "At this point, you should be able to..."

### Writing Rubrics

1. **Be objective**: "All 4 endpoints implemented" not "Good API design"

2. **Use points**: Break down score by specific criteria

3. **Include examples**: "Error handling (10 pts): Try-catch blocks in all routes, proper status codes"

4. **Match instructions**: Rubric should align with instruction steps

5. **Define levels**: What's worth 10/10 vs 7/10 vs 4/10

---

## Migration Instructions

If you already have existing exercises without instructions:

```sql
-- Example: Update an existing exercise
UPDATE exercises
SET instructions = 'Your step-by-step instructions here...',
    rubric = 'Your grading rubric here...'
WHERE id = 1;

-- Or update in bulk
UPDATE exercises
SET instructions = CASE type
  WHEN 'coding' THEN 'Default coding instructions...'
  WHEN 'study' THEN 'Default research instructions...'
  ELSE 'Default instructions...'
END
WHERE instructions IS NULL;
```

---

## Summary

The instructions feature transforms exercises from vague tasks into clear, actionable guides that:
- Help participants succeed
- Reduce organizer support burden
- Enable consistent grading
- Improve overall hackathon quality

**Next Steps**:
1. Run the migration (add instructions and rubric columns)
2. Create exercise templates for common types
3. Update existing exercises with instructions
4. Train admins/organizers on writing clear instructions
5. Build frontend UI to display instructions beautifully
