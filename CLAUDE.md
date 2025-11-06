# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hackathon Management Platform - A full-stack application for conducting hackathons with team management, exercise tracking, AI-powered grading, and live leaderboards.

**Architecture**: Monorepo with separate backend and frontend directories

**Tech Stack**:
- **Backend**: Node.js + Express + TypeScript, PostgreSQL, Socket.IO, OpenAI integration
- **Frontend**: React 18 + TypeScript + Vite, Zustand state management, React Router
- **Storage**: AWS S3/MinIO/local filesystem (auto-detects)

## Entity Relationships and Data Flow

**Hackathon-Centric Architecture**: Everything in this platform revolves around hackathons.

```
Hackathon (1)
  ↓
  ├── Teams (many) ────────────┐
  │    ↓                       │
  │    └── TeamMembers (many)  │
  │         ↓                   │
  │         └── Users (many)   │
  │                             │
  ├── Exercises (many)          │
  │    ↓                        │
  │    └── Assigned via         │
  │        team_exercises ←─────┘
  │         ↓
  │         └── Submissions (many)
  │              ↓
  │              └── Grades (many)
  │                   ↓
  └──────────────> Leaderboard (calculated)
```

**Key Relationships**:
- Users join Teams through `team_members` junction table
- Teams belong to one Hackathon
- Exercises belong to one Hackathon and are assigned to Teams via `team_exercises`
- Submissions are created by Users for specific TeamExercises
- Grades are created by Judges for Submissions
- Leaderboard is dynamically calculated from Grades

**Data Flow for a Typical Hackathon**:
1. Admin creates Hackathon (status: 'planning')
2. Admin imports Users via CSV bulk import
3. Admin creates Teams and assigns Users as members
4. Admin creates Exercises and assigns them to Teams
5. Admin activates Hackathon (status: 'active')
6. Participants submit work for assigned Exercises
7. Judges grade Submissions
8. Leaderboard updates automatically via WebSocket
9. Admin completes Hackathon (status: 'completed')

## Common Commands

### Development
```bash
# Start infrastructure (from project root)
docker-compose up -d postgres minio    # Start PostgreSQL and MinIO
docker-compose logs -f postgres         # View PostgreSQL logs

# Backend development
cd backend
npm install
npm run migrate          # Run database migrations
npm run dev              # Start dev server with hot reload on port 5001
npm run build            # Compile TypeScript to dist/
npm start                # Run production build

# Frontend development (in separate terminal)
cd frontend
npm install
npm run dev              # Start Vite dev server on port 5173
npm run build            # Build for production
npm run preview          # Preview production build

# Database operations
docker-compose exec -T postgres psql -U postgres -d hackathon_platform_test              # Connect to database
docker-compose exec -T postgres psql -U postgres -d hackathon_platform_test -c "\d+"     # List all tables
```

### Testing
```bash
# No automated tests currently. Test API manually with cURL:

# Test API with cURL (get token first)
TOKEN=$(curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# Use token for authenticated requests
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/hackathons
```

## Architecture Overview

### Frontend Architecture (React + TypeScript + Vite)

**Structure**:
```
frontend/src/
├── components/
│   ├── common/         # Reusable UI (Button, Card, Modal, Input, etc.)
│   ├── layouts/        # AdminLayout, JudgeLayout, ParticipantLayout
│   └── auth/           # ProtectedRoute with role-based guards
├── pages/
│   ├── admin/          # Admin-specific pages
│   ├── judge/          # Judge-specific pages
│   ├── participant/    # Participant-specific pages
│   └── public/         # Public pages (Leaderboard)
├── services/           # API clients (axios-based)
├── store/              # Zustand stores with persistence
├── types/              # TypeScript type definitions
├── App.tsx             # Routes and auth initialization
└── main.tsx            # Entry point
```

**Key Patterns**:

1. **State Management - Zustand with Persistence**:
   - `authStore` (`store/authStore.ts`): JWT token, user data, login/logout
   - `hackathonStore` (`store/hackathonStore.ts`): Selected hackathon context
   - Both use `persist` middleware to survive page reloads
   - **CRITICAL**: Must call `authStore.initialize()` in `App.tsx` on mount

2. **Protected Routes with Role Guards**:
   - `<AdminRoute>` - Requires admin role
   - `<JudgeRoute>` - Requires judge or admin role
   - `<ParticipantRoute>` - Requires participant role
   - All routes wrap pages in corresponding Layout component (e.g., `<AdminLayout><Page /></AdminLayout>`)

3. **API Services Pattern**:
   - Each domain has a service file (e.g., `team.service.ts`, `exercise.service.ts`)
   - Axios instance in `config/axios.ts` with interceptors
   - Interceptor automatically adds `Authorization: Bearer ${token}` header
   - **IMPORTANT**: All services expect wrapped responses (e.g., `response.data.teams` not `response.data`)

4. **Type Safety**:
   - Types in `src/types/*.types.ts` must match backend database schema
   - Example: `CreateExerciseRequest` uses `type` and `max_score` (NOT `category`/`difficulty`/`points`)
   - Always include `hackathon_id` in create requests for teams/exercises

5. **Hackathon Context**:
   - `HackathonSelector` component in admin navbar
   - Admin must select hackathon before accessing Teams/Exercises
   - Selection stored in Zustand and persists across sessions
   - All API calls pass `hackathon_id` query parameter

6. **Service Method Patterns**:
```typescript
// ✅ Correct patterns
async getAll(params?: { hackathon_id?: number }): Promise<Team[]> {
  const response = await api.get<{ teams: Team[] }>('/api/teams', { params })
  return response.data.teams  // Extract from wrapper
}

async getById(id: number): Promise<Team> {
  const response = await api.get<{ team: Team }>(`/api/teams/${id}`)
  return response.data.team  // Extract from wrapper
}

async create(data: CreateTeamRequest): Promise<Team> {
  const response = await api.post<{ team: Team }>('/api/teams', data)
  return response.data.team
}

// ❌ Common mistakes
// - Not extracting from wrapper: return response.data (returns { teams })
// - Wrong TypeScript generic: api.get<Team[]> (expects unwrapped array)
// - Forgetting optional params: getAll(): Promise<Team[]> (can't filter)
```

### Three-Tier Storage System

The platform uses a **cascading storage architecture** that automatically falls back between cloud and local storage:

1. **Primary**: AWS S3 (if `AWS_ACCESS_KEY_ID` or `USE_AWS_S3=true` in env)
2. **Secondary**: MinIO (if `USE_MINIO≠false` and AWS not configured)
3. **Fallback**: Local filesystem (`uploads/` directory)

**Key files**:
- `backend/src/services/fileStorageService.ts` - Unified storage interface with automatic fallback
- `backend/src/config/s3.ts` - AWS S3 client and operations
- `backend/src/config/minio.ts` - MinIO client and bucket initialization

All file operations use `uploadFile()`, `getFileUrl()`, and `deleteFile()` which automatically route to the correct backend. Storage selection happens at runtime based on environment variables.

### Role-Based Authentication System

JWT-based authentication with three roles:
- **admin**: Full access (users, hackathons, teams, exercises, grading)
- **judge**: Can grade submissions and view all data
- **participant**: Can view exercises and submit work

**Key files**:
- `backend/src/middleware/auth.ts` - Token verification and role guards
- `backend/src/utils/jwt.ts` - Token generation and verification
- Authentication middleware: `authenticateToken`, `requireAdmin`, `requireAdminOrJudge`

All protected routes use middleware chain: `authenticateToken` → `requireRole(...)` → controller

### Real-Time WebSocket System

Socket.io implementation for live leaderboard updates:

**Architecture**:
- `backend/src/server.ts:16-53` - Socket.io server initialization
- Clients join hackathon-specific rooms: `socket.join(\`hackathon-${hackathonId}\`)`
- Controllers emit updates: `socketio.to(\`hackathon-${id}\`).emit('leaderboard-update', data)`

**Events**:
- Client→Server: `join-hackathon`, `leave-hackathon`
- Server→Client: `leaderboard-update`, `exercise-update`

The `socketio` instance is exported from `server.ts` and imported by controllers to broadcast updates.

### AI Grading System

OpenAI GPT-4 integration for automated code review and grading:

**Key files**:
- `backend/src/services/aiGradingService.ts` - Core grading logic
- `backend/src/controllers/aiGradingController.ts` - API endpoints

**Configuration**:
- Enabled via `AI_GRADING_ENABLED=true` environment variable
- Uses `OPENAI_API_KEY` for authentication
- Model: `OPENAI_MODEL` (default: gpt-4-turbo-preview)

**Features**:
- Single submission grading with detailed feedback
- Batch grading for all ungraded submissions
- Code analysis without grading
- Re-grading capability
- Returns: score, feedback, strengths, improvements, confidence level

### Database Architecture

PostgreSQL with raw SQL queries (no ORM):

**Key patterns**:
- Connection pooling via `backend/src/config/database.ts` (max 20 connections)
- Models in `backend/src/models/` contain static methods for CRUD operations
- All queries use parameterized statements to prevent SQL injection
- Database migrations are SQL files in `database/migrations/` (run manually via psql)

**Schema structure**:
- `users` - Authentication and role management
- `hackathons` - Event configuration (planning/active/completed states)
- `teams` - Team organization with many-to-many user relationships
- `exercises` - Tasks with instructions, rubrics, and time tracking
- `submissions` - File/text/URL submissions with grading
- `grades` - Manual and AI-generated evaluations
- `leaderboard` - Materialized view of team scores

### Backend Architecture (Express + TypeScript)

**Structure**:
```
backend/src/
├── config/          # Database, MinIO, S3 configuration
├── controllers/     # Request handlers (thin layer, delegates to models)
├── models/          # Business logic and database queries
├── routes/          # API route definitions
├── middleware/      # Auth, validation, error handling
├── services/        # External services (file storage, AI grading)
├── utils/           # JWT, password generation
└── server.ts        # Entry point, Express + Socket.IO setup
```

**Request Flow**:
1. Client sends JWT in `Authorization: Bearer <token>` header
2. `authenticateToken` middleware verifies token and attaches `req.user`
3. `requireRole()` middleware checks user has required role
4. Controller validates input using express-validator
5. Model method executes database query
6. **Controller returns JSON response wrapped in object** (e.g., `res.json({ teams })`)
7. If leaderboard-affecting: controller emits Socket.io event to update clients

**CRITICAL: API Response Standardization**

ALL backend controllers must wrap responses in objects for consistency:

```typescript
// ✅ Correct
res.json({ teams })
res.json({ team })
res.json({ exercises })
res.json({ message: 'Success' })

// ❌ Wrong
res.json(teams)
res.json(team)
```

This pattern is used throughout the codebase for extensibility and frontend compatibility.

### Environment Configuration

The system behavior changes significantly based on environment variables:

**Storage selection**:
- AWS S3: Set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`
- MinIO: Set `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` (default in docker-compose)
- Local: No storage env vars (automatic fallback)

**Database connection**:
- Standard: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- Local development uses `DB_NAME=hackathon_platform_test` (as defined in backend/.env)
- PostgreSQL runs in Docker container, accessed via `docker-compose exec -T postgres`
- AWS RDS: SSL automatically enabled if `DB_HOST` contains `rds.amazonaws.com`

**AI Grading**:
- `AI_GRADING_ENABLED=true` and `OPENAI_API_KEY` required

See `.env.example` or README deployment guides for full configuration options.

## API Endpoint Conventions

**URL Patterns**:
- Collections: `GET /api/teams?hackathon_id=1`
- Single resource: `GET /api/teams/10`
- Sub-resources: `GET /api/teams/10/members`
- Actions: `POST /api/exercises/start`
- Status updates: `PATCH /api/hackathons/1/status`

**Query Parameters**:
- Always use `hackathon_id` for filtering by hackathon
- Use `team_id` for team-specific queries
- Use `ungraded=true` for filtering ungraded submissions
- Use `is_active=true` for filtering active exercises (maps to `status='active'`)

**Response Patterns**:
- Lists: `{ teams: [...] }`, `{ exercises: [...] }`
- Single items: `{ team: {...} }`, `{ exercise: {...} }`
- Nested data: `{ team: {..., members: [...]} }`
- Success messages: `{ message: "Success" }`
- Errors: `{ error: "Error message" }`

**Authentication**:
- All endpoints except `/api/auth/login` require JWT token
- Token sent via `Authorization: Bearer <token>` header
- Token auto-attached by axios interceptor in frontend

## Critical Implementation Details

### Frontend-Backend Type Alignment

Frontend types MUST match backend database schema. Recent standardization:

**Exercise Types** (`frontend/src/types/exercise.types.ts`):
```typescript
// ✅ Correct (matches DB schema)
interface CreateExerciseRequest {
  hackathon_id?: number
  title: string
  description: string
  type: 'coding' | 'study' | 'presentation' | 'deployment' | 'other'
  max_score: number
  time_limit_minutes?: number
  start_time?: string
  flags?: CreateFlagRequest[]
}

// ❌ Old/incorrect - DO NOT USE
// category, difficulty, points, time_limit
```

**Database Schema Reference** (exercises table):
- `type` VARCHAR(30) - enum constraint
- `max_score` INTEGER NOT NULL DEFAULT 100
- `time_limit_minutes` INTEGER
- No `category`, `difficulty`, or `points` columns exist

### Authentication Persistence

The auth system persists across page reloads via Zustand persistence:

**Required in `App.tsx`**:
```typescript
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'

function App() {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    initialize()  // CRITICAL: Restores token from localStorage
  }, [initialize])

  return (
    // ... routes
  )
}
```

Without this initialization, users must re-login on every page refresh.

### Hackathon Selection Pattern

Admin pages require hackathon context:

```typescript
import { useHackathonStore } from '@/store/hackathonStore'

const MyAdminPage = () => {
  const { selectedHackathon } = useHackathonStore()

  useEffect(() => {
    if (selectedHackathon) {
      loadData()
    }
  }, [selectedHackathon])

  const loadData = async () => {
    // Pass hackathon_id to API
    const data = await service.getAll({
      hackathon_id: selectedHackathon.id
    })
  }

  const handleCreate = async () => {
    if (!selectedHackathon) {
      toast.error('Please select a hackathon first')
      return
    }

    await service.create({
      ...formData,
      hackathon_id: selectedHackathon.id,
    })
  }
}
```

## Important Implementation Details

### Bulk User Import
The CSV bulk import (`POST /api/users/bulk`) auto-generates usernames and passwords. Usernames follow pattern: `participant001`, `participant002`, etc. Passwords are random 8-character alphanumeric strings. Response includes generated credentials for distribution.

### Exercise Timer System
Exercises have `start_time` and `duration_minutes`. Timer starts when participant calls `POST /api/exercises/start`. Time tracking is passive - no automatic status changes. Frontend should calculate remaining time client-side.

### Leaderboard Calculation
Leaderboard is recalculated on every grade submission. Calculation:
1. Sum all exercise max scores for hackathon
2. For each team: sum average grade per exercise (multiple judges averaged)
3. Rank teams by total score descending
4. WebSocket broadcast to all clients in hackathon room

### File Upload Flow
1. Multer middleware saves to local `uploads/temp/` directory
2. `fileStorageService.uploadFile()` uploads to S3/MinIO and deletes temp file
3. OR if cloud upload fails, moves temp file to permanent local location
4. File URL stored in database (presigned URL for S3/MinIO, relative path for local)
5. Presigned URLs regenerated on read with 24-hour expiry

## Common Development Workflows

### Adding a New API Endpoint

1. **Backend**: Define route in `backend/src/routes/index.ts`
2. **Backend**: Create controller method in `backend/src/controllers/*Controller.ts`
3. **Backend**: Add model method in `backend/src/models/*.ts` for database queries
4. **Backend**: Remember to wrap response: `res.json({ data })`
5. **Frontend**: Add types in `frontend/src/types/*.types.ts`
6. **Frontend**: Add service method in `frontend/src/services/*.service.ts`
7. **Frontend**: Extract from wrapper: `return response.data.data`

### Adding a New Admin Page

1. Create component in `frontend/src/pages/admin/MyPage.tsx`
2. Add route in `App.tsx`:
   ```tsx
   <Route
     path="/admin/my-page"
     element={
       <AdminRoute>
         <AdminLayout>
           <MyPage />
         </AdminLayout>
       </AdminRoute>
     }
   />
   ```
3. Add navigation link in `AdminLayout` sidebar
4. Use `useHackathonStore()` if page needs hackathon context
5. Use corresponding API service for data fetching

### Creating Database Migrations

1. Add SQL file in `database/migrations/` with incremented number (e.g., `003_my_changes.sql`)
2. Run manually: `docker-compose exec -T postgres psql -U postgres -d hackathon_platform_test -f /migrations/003_my_changes.sql`
3. Or restart Docker (migrations auto-run on init)
4. Update TypeScript types in both backend models and frontend types

### Managing Teams and Members

**Creating a Team**:
```typescript
// 1. Admin selects hackathon via HackathonSelector
// 2. Admin creates team with hackathon_id
await teamService.create({
  name: 'Team Alpha',
  description: 'Optional description',
  hackathon_id: selectedHackathon.id
})

// 3. Team is created with empty members array
// 4. Admin navigates to team details page
```

**Adding Members to Team**:
```typescript
// From TeamDetails page
// 1. Load unassigned participants for this hackathon
const available = await teamService.getUnassignedParticipants(hackathonId)

// 2. Add selected user to team
await teamService.addMember(teamId, userId)

// 3. Refresh team data to show new member
const updated = await teamService.getById(teamId)
```

**Viewing Team Details**:
```typescript
// Team details page loads 3 things in parallel:
// 1. Team basic info
const team = await teamService.getById(teamId)

// 2. Team members (full user data with join dates)
const members = await teamService.getMembers(teamId)

// 3. Unassigned participants (for add member dropdown)
const unassigned = await teamService.getUnassignedParticipants(hackathonId)
```

**Critical Notes**:
- Teams MUST be assigned to a hackathon via `hackathon_id`
- Unassigned participants query requires `hackathon_id` parameter
- Backend endpoint is `/api/teams/unassigned?hackathon_id=1` (NOT `/unassigned-participants`)
- Member data includes `joined_at` timestamp from `team_members` table

## Common Debugging Tips

### Frontend Errors

**"hackathon_id or team_id is required"**:
- Ensure admin has selected a hackathon via `HackathonSelector`
- Check that API calls include `hackathon_id` parameter
- Verify `useHackathonStore()` is being used

**"Missing required fields" on exercise creation**:
- Verify `CreateExerciseRequest` type matches DB schema
- Use `type` and `max_score` fields (not `category`/`difficulty`/`points`)
- Check formData matches the type definition

**"Cannot read properties of undefined (reading 'length')"**:
- Backend returning unwrapped response (e.g., `res.json(teams)`)
- Should be wrapped: `res.json({ teams })`
- Frontend service expecting `response.data.teams`

**Authentication not persisting across reloads**:
- Ensure `authStore.initialize()` is called in `App.tsx` useEffect
- Check localStorage has `auth-storage` key
- Token may be expired (24h default)

**Team member data display issues**:
- Backend returns team members with `id` field (not `user_id`)
- Use `team.members?.length` for member count (not `team.member_count`)
- Member objects include: `id`, `username`, `full_name`, `email`, `role`, `created_at`, `joined_at`
- Frontend `TeamMember` interface extends `User`, expecting standard user fields

**Cascading error handling pattern**:
- Separate try-catch blocks for each API call prevents single failures from showing misleading errors
- Make non-critical API calls optional (fail silently with console.log)
- Only show error toast for critical failures that prevent page functionality

**"Invalid team ID" or NaN errors in database logs**:
- Check that team.id exists and is a valid number before navigation
- Add validation: `if (team.id && !isNaN(team.id))` before using IDs
- PostgreSQL will log "invalid input syntax for type integer: 'NaN'" if passed undefined
- Use console.log to debug data received from API

**API endpoint 404 errors**:
- Verify exact endpoint path matches backend routes (see `backend/src/routes/index.ts`)
- Common mismatch: `/teams/unassigned` vs `/teams/unassigned-participants`
- Check both route definition AND controller method name
- Test endpoint with curl before implementing in frontend

**Member count showing 0 when members exist**:
- Backend returns `members` array, not `member_count` field
- Use `team.members?.length` instead of `team.member_count`
- Backend `findByHackathon()` and `findByIdWithMembers()` include full member data

### Backend Errors

### Storage Issues
Check which storage backend is active: `GET /api/ai-grading/status` shows storage configuration in logs.

If MinIO connection fails, verify:
- MinIO is running: `docker ps | grep minio`
- Bucket exists: Check MinIO console at http://localhost:9001
- Environment variables match docker-compose settings

### Database Connection Errors
The pool configuration includes SSL auto-detection for RDS. For local development, ensure `DB_HOST=localhost` (not RDS hostname) to avoid SSL errors.

**IMPORTANT**: Check `.env` file for actual configuration:
- Backend runs on port `5001` (not 5000) in local development
- Database is `hackathon_platform_test` (not hackathon_platform)
- Always verify environment variables match your setup

### Schema Mismatch Errors
When backend queries succeed but frontend displays incorrect data:
1. Compare database column names to frontend TypeScript types
2. Check backend model SELECT queries return correct field names
3. Example: Backend returning `u.id as user_id` won't match frontend expecting `id`
4. Use `docker-compose exec -T postgres psql -U postgres -d hackathon_platform_test -c "\\d+ table_name"` to inspect schema

### WebSocket Not Updating
Clients must explicitly join rooms via `socket.emit('join-hackathon', hackathonId)`. Controllers emit to rooms, not to individual sockets. Check client has joined correct room.

### AI Grading Failures
- Verify `AI_GRADING_ENABLED=true` in .env
- Check OpenAI API key is valid and has credits
- Large files may timeout - OpenAI has token limits (configured via `OPENAI_MAX_TOKENS`)

## Known Issues & Open Bugs

### Active Issues (2025-11-06)

#### **Issue #1: Participant Stats Showing 0/0 - BACKEND BUG** 🔴
**Status**: Open - Backend Issue
**Severity**: Medium
**Component**: Participant Dashboard Stats

**Problem**: The `GET /api/stats/participant` endpoint returns all zeros even when:
- User is assigned to a team
- Team has active exercises
- Exercises exist in the hackathon

**Current Response**:
```json
{
  "hasTeam": false,
  "totalExercises": 0,
  "completedExercises": 0,
  "pendingExercises": 0,
  "totalScore": 0,
  "rank": null
}
```

**Root Cause**: The backend stats calculation is not correctly:
1. Finding the user's team membership
2. Counting exercises in the team's hackathon
3. Calculating completed vs pending exercises

**Files Affected**:
- `backend/src/controllers/statsController.ts` (or similar)
- `backend/src/models/Stats.ts` (or similar)

**Fix Required**: Backend needs to properly query:
```sql
-- Find user's team
SELECT t.* FROM teams t
JOIN team_members tm ON t.id = tm.team_id
WHERE tm.user_id = $1

-- Count exercises for team's hackathon
SELECT COUNT(*) FROM exercises WHERE hackathon_id = $2 AND status = 'active'

-- Count completed (graded submissions)
-- Count pending (ungraded submissions)
```

**Workaround**: Stats display will show 0/0 until backend is fixed. Dashboard still functions.

---

#### **Issue #2: team_exercise_id Lookup Missing** 🟡
**Status**: Open - Workaround in Place
**Severity**: Medium
**Component**: Exercise Submissions

**Problem**: When submitting work, frontend needs `team_exercise_id` from the `team_exercises` junction table, but there's no API endpoint to get it.

**Current Workaround**: Using `team.id` as a placeholder (line 50 in `ExerciseDetail.tsx`)

**Files Affected**:
- `frontend/src/pages/participant/ExerciseDetail.tsx:47-50`

**Fix Required**: Add backend endpoint:
```
GET /api/team-exercises?team_id=X&exercise_id=Y
Response: { team_exercise_id: 123 }
```

**Impact**: Submissions may fail if the workaround doesn't match backend expectations.

---

## Undeployed Changes

This section tracks changes made during development that have not yet been deployed to production.

### Session: 2025-11-06 - Professional UI Redesign

**Summary**: Major UI/UX improvements across participant pages to create enterprise-grade professional appearance.

**Files Changed**:

1. **frontend/src/pages/participant/ExerciseDetail.tsx** ✅
   - Removed all emojis from submission type selectors
   - Added clear labels: "File Upload", "Text Submission", "URL Link"
   - Added descriptive subtitles for each submission method
   - Professional form layouts with proper information boxes
   - Improved sidebar with card-based Exercise Information layout
   - Enhanced grading criteria display

2. **frontend/src/pages/participant/ExerciseList.tsx** ✅
   - Removed emojis from exercise cards
   - Professional empty state with SVG icon
   - Better card layout with status badges
   - Improved typography and spacing
   - "Max Score" label added for clarity

3. **frontend/src/pages/participant/ParticipantDashboard.tsx** ✅
   - Removed ALL emojis from StatsCard components
   - Clean Quick Action buttons without emojis
   - Professional empty states with proper iconography
   - Better visual hierarchy throughout

4. **frontend/src/pages/participant/MySubmissions.tsx** ✅
   - Fixed error popup by using `teamService.getMyTeam()` instead of `getAll()`
   - Better error handling with user-friendly messages

5. **frontend/src/pages/public/Leaderboard.tsx** ✅
   - Added back button that routes to correct dashboard based on user role
   - Removed trophy emoji from header (kept professional "Leaderboard" title)

6. **frontend/src/services/submission.service.ts** ✅
   - Added `submitFile()`, `submitText()`, `submitUrl()` methods
   - Proper FormData handling for file uploads
   - Support for all submission types: file, text, url

7. **frontend/src/types/exercise.types.ts** ✅
   - Added `instructions` and `rubric` to `CreateExerciseRequest`
   - Updated `UpdateExerciseRequest` to match database schema
   - Removed obsolete fields (category, difficulty, points, is_active)

8. **frontend/src/pages/admin/CreateExercise.tsx** ✅
   - Removed CTF-style flags system (not implemented in backend)
   - Added Instructions field for participant guidance
   - Added Rubric field for AI grading criteria
   - Professional form layout with clear sections
   - AI Grading badge and helpful tips

9. **frontend/src/pages/admin/EditExercise.tsx** ✅
   - New page created for editing exercises
   - Status management buttons (Draft/Active/Completed/Cancelled)
   - Full exercise editing with all fields
   - Metadata display (created date, submissions, etc.)

10. **frontend/src/pages/admin/ManageExercises.tsx** ✅
    - Fixed to use correct field names: `status`, `type`, `max_score`
    - Replaced `toggleActive()` with `updateStatus()` method
    - Updated filters: Status and Type (not Difficulty/Category)
    - Proper status badges with colors
    - Working activate/deactivate buttons

11. **backend/src/controllers/exercisesController.ts** ✅
    - Added `instructions` and `rubric` to create method
    - Now extracts and stores these fields from request body

**Testing Notes**:
- All changes require browser hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
- Backend fully supports file uploads via multer + S3/MinIO/Local storage
- Exercise status system working end-to-end

---

### Session: 2025-11-05 - Team Details View Bug Fixes

**Issue**: "View Details" button on Manage Teams page was not working, showing error popups.

**Root Causes Identified**:
1. Wrong API endpoint: Frontend calling `/api/teams/unassigned-participants` but backend route was `/api/teams/unassigned`
2. Invalid team IDs: PostgreSQL logs showed frontend sending `"NaN"` as team ID to database
3. Missing validation before navigation and API calls

**Files Changed**:

1. **frontend/src/services/team.service.ts** ✅
   - Fixed `getAll()` to accept optional `hackathon_id` parameter
   - Added `getMyTeam()` method for participant dashboard
   - Fixed `addMember()` signature (teamId, userId)
   - **CRITICAL FIX**: Changed endpoint from `/api/teams/unassigned-participants` → `/api/teams/unassigned`
   - Added `removeMember()` method
   - Added `getTeamStats()` method

2. **frontend/src/pages/admin/ManageTeams.tsx** ✅
   - Integrated `useHackathonStore()` to filter teams by selected hackathon
   - Changed from `window.location.href` to React Router `navigate()`
   - Added validation before navigation: checks if `team.id` is valid (not NaN)
   - Fixed member count: `team.member_count` → `team.members?.length`
   - Added `hackathon_id` to team creation
   - Added console logging for debugging team data
   - Shows error toast if invalid team ID detected

3. **frontend/src/pages/admin/TeamDetails.tsx** ✅
   - Added validation to check if team ID is valid before API calls
   - Shows error toast and redirects if team ID is NaN or invalid
   - Prevents database errors from malformed requests

**Backend Endpoints Verified**:
- ✅ `GET /api/teams?hackathon_id=1` - Returns team list
- ✅ `GET /api/teams/:id` - Returns team details with members
- ✅ `GET /api/teams/:id/members` - Returns team members list
- ✅ `GET /api/teams/unassigned?hackathon_id=1` - Returns unassigned participants

**Testing Notes**:
- All endpoints tested via curl and confirmed working
- Database contains 10 teams (IDs 2-11) with 1 member each
- Frontend `.env` already has correct `VITE_API_URL=http://localhost:5001`
- Changes require browser hard refresh to test (Cmd+Shift+R / Ctrl+Shift+F5)

**Status**: Changes made but not committed. Ready for testing in browser.

---

## Default Credentials

**Admin**: username `admin`, password `admin123` (created by migration)
**Change immediately in production!**
- once a feature or fix is complete, add and commit appropriately
- Never mention claude in any commits or code