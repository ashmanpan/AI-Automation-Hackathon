# Frontend Development Tasks
**For: Tomorrow (October 14, 2025)**
**Total Estimated Time: 11-13 hours**

---

## Prerequisites

Before starting, ensure:
- Backend is running (`npm run dev` in `/backend`)
- PostgreSQL database is set up and migrations are applied
- You have basic knowledge of React, TypeScript, and REST APIs

---

## Task List

### ✅ Task 1: Setup Frontend Project (30 minutes)

**Goal**: Initialize React + TypeScript + Vite project with all dependencies

**Commands**:
```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install

# Core dependencies
npm install react-router-dom axios socket.io-client
npm install @tanstack/react-query zustand

# UI library (choose one)
npm install @mui/material @emotion/react @emotion/styled  # Material-UI
# OR
npm install -D tailwindcss postcss autoprefixer           # Tailwind CSS

# Markdown editor (for exercise instructions)
npm install react-markdown-editor-lite markdown-it
npm install --save-dev @types/markdown-it

npm run dev
```

**Deliverables**:
- Working Vite dev server on `http://localhost:5173`
- All dependencies installed
- Basic project structure set up

---

### ✅ Task 2: Create Admin Login Page (1 hour)

**Goal**: Allow admin users to authenticate

**Features**:
- Login form with username and password fields
- Call `POST /api/auth/login` with credentials
- Store JWT token in localStorage
- Redirect to dashboard on success
- Show error message on failure

**API Endpoint**:
```typescript
POST /api/auth/login
Body: { username: string, password: string }
Response: { token: string, user: { id, username, role } }
```

**Default Credentials**:
- Username: `admin`
- Password: `admin123`

**File**: `frontend/src/pages/Login.tsx`

**Implementation Tips**:
```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      username,
      password
    });
    localStorage.setItem('token', response.data.token);
    navigate('/dashboard');
  } catch (error) {
    setError('Invalid credentials');
  }
};
```

---

### ✅ Task 3: Create Admin Dashboard (2 hours)

**Goal**: Main landing page for admin users

**Features**:
- Sidebar navigation with links to:
  - Dashboard (home)
  - Import Users
  - Manage Teams
  - Create Exercise
  - Leaderboard
- Overview statistics:
  - Total participants
  - Total teams
  - Active exercises
  - Current hackathon status
- Quick actions:
  - Create new hackathon
  - Import participants
  - Create team
  - Create exercise

**API Endpoints**:
```typescript
GET /api/hackathons/active         # Get current hackathon
GET /api/users?role=participant    # Count participants
GET /api/teams?hackathon_id=:id    # Get teams
GET /api/exercises?hackathon_id=:id # Get exercises
```

**File**: `frontend/src/pages/admin/Dashboard.tsx`

**UI Components**:
- Sidebar/AppBar for navigation
- Stats cards showing counts
- Button grid for quick actions

---

### ✅ Task 4: Create Participant Import Page (2 hours)

**Goal**: Bulk import participants from CSV file

**Features**:
- CSV file upload (drag-and-drop or file picker)
- Preview CSV contents before import
- Call `POST /api/users/bulk` to import
- Display generated credentials (username + password) in a table
- Download credentials as CSV or TXT file
- Copy all credentials to clipboard

**CSV Format**:
```csv
full_name,email,role
John Doe,john@example.com,participant
Jane Smith,jane@example.com,participant
```

**API Endpoint**:
```typescript
POST /api/users/bulk
Headers: { 'Content-Type': 'multipart/form-data' }
Body: FormData with 'file' field
Response: {
  users: Array<{
    id: number,
    full_name: string,
    username: string,
    password: string,  // Plain text for download
    email: string,
    role: string
  }>
}
```

**File**: `frontend/src/pages/admin/ImportUsers.tsx`

**Implementation Tips**:
```typescript
const handleFileUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post('http://localhost:5000/api/users/bulk', formData, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'multipart/form-data'
    }
  });

  setGeneratedUsers(response.data.users);
};
```

---

### ✅ Task 5: Create Team Management Page (2 hours)

**Goal**: Create and manage hackathon teams

**Features**:
- Create new team form (name, description)
- View all teams in current hackathon
- Add members to team:
  - Dropdown showing unassigned participants
  - Or drag-and-drop interface
- Remove members from team
- Delete team
- View team details (members, assigned exercises, submissions)

**API Endpoints**:
```typescript
POST /api/teams
Body: { hackathon_id: number, name: string, description?: string }

GET /api/teams/unassigned?hackathon_id=:id
Response: { users: Array<User> }

POST /api/teams/:id/members
Body: { user_id: number }

DELETE /api/teams/:id/members/:userId

GET /api/teams/:id
Response: { team: Team, members: Array<User> }

DELETE /api/teams/:id
```

**File**: `frontend/src/pages/admin/Teams.tsx`

**UI Components**:
- Team creation form
- Team list/grid with member counts
- Modal for adding members
- Confirmation dialog for deletions

---

### ✅ Task 6: Create Exercise Creation Page with Markdown Editor (3 hours) ⭐

**Goal**: Create exercises with step-by-step instructions and grading rubrics

**Features**:

#### Basic Form Fields:
- **Title** (text input) - Exercise name
- **Description** (textarea) - Brief overview
- **Type** (dropdown) - Options: coding, study, presentation, deployment, other
- **Max Score** (number input) - Maximum points for this exercise
- **Time Limit** (number input) - Duration in minutes

#### Markdown Editor for Instructions (Step-by-Step User Guide):
- Use `react-markdown-editor-lite` component
- **Split-pane view**: Editor on left, live preview on right
- **Toolbar** with formatting options:
  - Headers (H1, H2, H3)
  - Bold, italic, strikethrough
  - Lists (ordered, unordered)
  - Code blocks and inline code
  - Links and images
  - Blockquotes
- **Height**: 500px
- **Parser**: `markdown-it` for rendering
- **Purpose**: Participants will see this as their guide for completing the exercise

#### Markdown Editor for Rubric (Grading Criteria):
- Second markdown editor for evaluation criteria
- **Height**: 350px
- Same formatting toolbar
- **Purpose**: Used by judges and AI for consistent grading

#### Template Selector:
- Button to load pre-built templates for each exercise type
- Templates available for:
  - **Coding Exercise** (e.g., "Build a REST API with Authentication")
  - **Research Exercise** (e.g., "AI Ethics Research Paper")
  - **Deployment Exercise** (e.g., "Deploy Application to Cloud")
  - **Presentation Exercise** (e.g., "Create Product Pitch Deck")
- See `EXERCISE_INSTRUCTIONS_GUIDE.md` for complete template examples

#### Team Assignment:
- Checkbox: "Assign to all teams in hackathon"
- Or multi-select dropdown for specific team selection

#### Submit Handler:
- POST to `/api/exercises` with all fields
- Include `instructions` and `rubric` as text (Markdown format)

**API Endpoint**:
```typescript
POST /api/exercises
Body: {
  hackathon_id: number,
  title: string,
  description?: string,
  instructions?: string,  // Markdown text
  rubric?: string,        // Markdown text
  type: 'coding' | 'study' | 'presentation' | 'deployment' | 'other',
  max_score: number,
  time_limit_minutes?: number,
  assign_to?: 'all' | number[]  // Team assignment
}
```

**Implementation Example**:
```typescript
import { useState } from 'react';
import MdEditor from 'react-markdown-editor-lite';
import MarkdownIt from 'markdown-it';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt();

const CreateExercisePage = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'coding',
    max_score: 100,
    time_limit_minutes: 60,
    instructions: '',
    rubric: ''
  });

  const handleInstructionsChange = ({ text }: { text: string }) => {
    setFormData({ ...formData, instructions: text });
  };

  const handleRubricChange = ({ text }: { text: string }) => {
    setFormData({ ...formData, rubric: text });
  };

  const loadTemplate = () => {
    // Load template based on formData.type
    const templates = {
      coding: {
        instructions: `# Build a REST API\n\n## Step 1: Setup...\n\n## Step 2: Create endpoints...`,
        rubric: `## Grading Criteria\n\n- Code Quality (30 points)\n- Functionality (40 points)...`
      },
      // ... more templates
    };

    const template = templates[formData.type];
    setFormData({
      ...formData,
      instructions: template.instructions,
      rubric: template.rubric
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await axios.post('http://localhost:5000/api/exercises', {
      ...formData,
      hackathon_id: currentHackathonId
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    console.log('Exercise created:', response.data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Create New Exercise</h1>

      {/* Basic fields */}
      <input
        type="text"
        placeholder="Exercise Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />

      <select
        value={formData.type}
        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
      >
        <option value="coding">Coding</option>
        <option value="study">Research/Study</option>
        <option value="presentation">Presentation</option>
        <option value="deployment">Deployment</option>
        <option value="other">Other</option>
      </select>

      <button type="button" onClick={loadTemplate}>
        Load Template for {formData.type}
      </button>

      {/* Instructions Markdown Editor */}
      <div style={{ marginTop: '20px' }}>
        <label>
          <strong>Instructions (Step-by-Step Guide for Participants)</strong>
        </label>
        <MdEditor
          value={formData.instructions}
          style={{ height: '500px' }}
          renderHTML={(text) => mdParser.render(text)}
          onChange={handleInstructionsChange}
          placeholder="Write step-by-step instructions using Markdown..."
        />
      </div>

      {/* Rubric Markdown Editor */}
      <div style={{ marginTop: '20px' }}>
        <label>
          <strong>Grading Rubric (Evaluation Criteria)</strong>
        </label>
        <MdEditor
          value={formData.rubric}
          style={{ height: '350px' }}
          renderHTML={(text) => mdParser.render(text)}
          onChange={handleRubricChange}
          placeholder="Define grading criteria using Markdown..."
        />
      </div>

      <button type="submit">Create Exercise</button>
    </form>
  );
};

export default CreateExercisePage;
```

**File**: `frontend/src/pages/admin/CreateExercise.tsx`

**Reference Documentation**:
- See `EXERCISE_INSTRUCTIONS_GUIDE.md` for:
  - 4 complete exercise template examples
  - Best practices for writing instructions
  - Markdown formatting tips
  - Example rubrics

**CSS Import Required**:
```typescript
// In your main.tsx or App.tsx
import 'react-markdown-editor-lite/lib/index.css';
```

---

### ✅ Task 7: Create Leaderboard Display (1 hour)

**Goal**: Real-time leaderboard showing team rankings

**Features**:
- Table showing:
  - Rank
  - Team name
  - Total score
  - Number of completed exercises
  - Last submission time
- Real-time updates via WebSocket
- Highlight rank changes (animate when team moves up/down)
- Podium view for top 3 teams (visual display)
- Filter by hackathon

**API Endpoints**:
```typescript
GET /api/leaderboard?hackathon_id=:id
Response: {
  leaderboard: Array<{
    rank: number,
    team_id: number,
    team_name: string,
    total_score: number,
    completed_exercises: number,
    last_submission: Date
  }>
}

GET /api/leaderboard?hackathon_id=:id&podium=true
Response: { top3: Array<LeaderboardEntry> }
```

**WebSocket Events**:
```typescript
// Connect to WebSocket
const socket = io('http://localhost:5000');

// Join hackathon room
socket.emit('join-hackathon', { hackathonId });

// Listen for updates
socket.on('leaderboard-update', (data) => {
  setLeaderboard(data.leaderboard);
});
```

**File**: `frontend/src/pages/Leaderboard.tsx`

**Implementation Tips**:
```typescript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.emit('join-hackathon', { hackathonId: 1 });

    socket.on('leaderboard-update', (data) => {
      setLeaderboard(data.leaderboard);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <h1>Leaderboard</h1>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Team</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, index) => (
            <tr key={entry.team_id}>
              <td>{index + 1}</td>
              <td>{entry.team_name}</td>
              <td>{entry.total_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## Summary

**Total Tasks**: 7
**Total Time**: 11-13 hours (1.5 days)

**Breakdown**:
1. Setup (30 min)
2. Login Page (1 hour)
3. Dashboard (2 hours)
4. Import Users (2 hours)
5. Team Management (2 hours)
6. **Exercise Creation with Markdown Editor (3 hours)** ⭐
7. Leaderboard (1 hour)

**Key Dependencies**:
- `react-markdown-editor-lite` - Markdown editor with preview
- `markdown-it` - Markdown parser
- `socket.io-client` - WebSocket for real-time updates
- `axios` - HTTP client
- `react-router-dom` - Routing

**Notes**:
- Task #6 has been extended to 3 hours to include comprehensive Markdown editor functionality
- The Markdown editor will have split-pane live preview
- Template selector will speed up exercise creation
- All templates are documented in `EXERCISE_INSTRUCTIONS_GUIDE.md`

---

## Testing Checklist

After completing all tasks:

- [ ] Admin can log in
- [ ] Dashboard shows correct statistics
- [ ] CSV import works and generates credentials
- [ ] Credentials can be downloaded
- [ ] Teams can be created and members added
- [ ] Exercises can be created with Markdown instructions
- [ ] Markdown editor live preview works
- [ ] Template selector loads pre-built templates
- [ ] Leaderboard displays correctly
- [ ] WebSocket updates work in real-time
- [ ] All API calls include authentication token

---

## Next Steps (Day 2)

After completing frontend:
1. Write API tests
2. Write integration tests
3. Test both deployment options (on-prem and AWS Amplify)
4. Create documentation and video tutorial
5. Deploy to production

---

**Good luck! 🚀**
