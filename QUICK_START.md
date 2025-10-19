# Quick Start Guide - Hackathon Platform

## Overview

A complete hackathon management platform with team management, exercise tracking, grading, and real-time leaderboards.

## What's Been Built

### ✅ Complete Backend API (Node.js + TypeScript + PostgreSQL)
- Authentication & Authorization (JWT + Role-based access)
- User Management (CRUD + CSV Bulk Import + Auto-generated credentials)
- Hackathon Management (Create, manage, activate hackathons)
- Team Management (Create teams, assign participants)
- Exercise Management (Multiple types, time tracking, assignments)
- Submission System (File uploads, text, URLs, GitHub links)
- Grading System (Manual grading with feedback)
- Real-time Leaderboard (WebSockets for live updates)
- Podium Display (Top 3 teams)

### 📁 Project Structure

```
CiscoSP-Hackathon/
├── backend/
│   ├── src/
│   │   ├── config/                # Database configuration
│   │   ├── controllers/           # 6 API controllers
│   │   ├── models/                # 6 database models
│   │   ├── routes/                # Complete API routes
│   │   ├── middleware/            # Auth & validation
│   │   ├── utils/                 # JWT, password generation
│   │   └── server.ts              # Express server with Socket.io
│   ├── scripts/
│   │   ├── setup-database.sh      # Automated DB setup
│   │   └── generate-admin-hash.js # Password hashing utility
│   ├── sample-data/
│   │   └── participants.csv       # 20 sample participants
│   └── package.json               # Dependencies installed ✓
├── database/
│   └── migrations/
│       └── 001_initial_schema.sql # Complete database schema
├── README.md                      # Comprehensive documentation
├── API_TESTING_GUIDE.md          # Detailed API examples
└── QUICK_START.md                # This file
```

## Quick Setup (5 Minutes)

### 1. Configure PostgreSQL Password

Edit `backend/.env` and update the database password:

```bash
cd backend
nano .env

# Update this line with your PostgreSQL password:
DB_PASSWORD=your_actual_postgres_password
```

### 2. Set Up Database

```bash
# Option A: Using the automated script
bash scripts/setup-database.sh

# Option B: Manual setup
# Create database
createdb hackathon_platform

# Run migrations
psql -d hackathon_platform -f ../database/migrations/001_initial_schema.sql
```

### 3. Start the Server

```bash
npm run dev
```

Server will start on `http://localhost:5000`

### 4. Test the API

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# You'll get a JWT token in the response
```

## Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

**IMPORTANT**: Change this password immediately in production!

## Key Features & How to Use Them

### 1. Bulk Import Participants

```bash
# Upload CSV file to create multiple users at once
curl -X POST http://localhost:5000/api/users/bulk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@backend/sample-data/participants.csv"

# Response includes auto-generated usernames and passwords
```

**CSV Format:**
```csv
full_name,email,role
John Doe,john@example.com,participant
Jane Smith,jane@example.com,participant
```

Usernames are auto-generated as `firstname.lastname` and passwords are random 8-character strings.

### 2. Create a Hackathon

```bash
curl -X POST http://localhost:5000/api/hackathons \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Spring Hackathon 2024",
    "description": "24-hour coding competition",
    "start_time": "2024-04-01T09:00:00Z",
    "end_time": "2024-04-02T09:00:00Z"
  }'
```

### 3. Create Teams & Assign Members

```bash
# Create team
curl -X POST http://localhost:5000/api/teams \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Team Alpha",
    "hackathon_id": 1
  }'

# Add member to team
curl -X POST http://localhost:5000/api/teams/1/members \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 2}'
```

### 4. Create Exercises with Timers

```bash
curl -X POST http://localhost:5000/api/exercises \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hackathon_id": 1,
    "title": "Build a REST API",
    "description": "Create a simple CRUD API",
    "type": "coding",
    "max_score": 100,
    "time_limit_minutes": 120,
    "start_time": "2024-04-01T10:00:00Z",
    "assign_to": "all"
  }'
```

**Exercise Types:**
- `coding` - Programming challenges
- `study` - Research/documentation tasks
- `presentation` - Presentation preparation
- `deployment` - Deployment tasks
- `other` - Custom exercises

### 5. Submit Solutions

```bash
# Text submission
curl -X POST http://localhost:5000/api/submissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "team_exercise_id": 1,
    "submission_type": "text",
    "content": "Solution explanation..."
  }'

# File submission
curl -X POST http://localhost:5000/api/submissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "team_exercise_id=1" \
  -F "submission_type=file" \
  -F "file=@solution.zip"

# GitHub/URL submission
curl -X POST http://localhost:5000/api/submissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "team_exercise_id": 1,
    "submission_type": "github",
    "content": "https://github.com/user/repo"
  }'
```

### 6. Grade Submissions

```bash
curl -X POST http://localhost:5000/api/grades \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "submission_id": 1,
    "score": 85.5,
    "feedback": "Great work! Add error handling."
  }'
```

Grading automatically:
- Updates leaderboard
- Notifies teams (when WebSocket is connected)
- Recalculates rankings

### 7. View Leaderboard

```bash
# Basic leaderboard
curl http://localhost:5000/api/leaderboard?hackathon_id=1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Detailed (with exercise breakdown)
curl http://localhost:5000/api/leaderboard?hackathon_id=1&detailed=true \
  -H "Authorization: Bearer YOUR_TOKEN"

# Podium (top 3)
curl http://localhost:5000/api/leaderboard?hackathon_id=1&podium=true \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 8. Real-time Updates (WebSocket)

```javascript
// Frontend JavaScript example
const socket = io('http://localhost:5000');

// Join hackathon room
socket.emit('join-hackathon', 1);

// Listen for leaderboard updates
socket.on('leaderboard-update', (data) => {
  console.log('Leaderboard updated:', data);
  // Update UI
});
```

## API Endpoints Summary

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `POST /api/users/bulk` - **Bulk import from CSV**
- `POST /api/users/generate` - Generate credentials
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Hackathons
- `GET /api/hackathons` - Get all hackathons
- `GET /api/hackathons/active` - Get active hackathon
- `POST /api/hackathons` - Create hackathon
- `PATCH /api/hackathons/:id/status` - Activate/complete

### Teams
- `GET /api/teams?hackathon_id=:id` - Get teams
- `POST /api/teams` - Create team
- `POST /api/teams/:id/members` - Add member
- `DELETE /api/teams/:id/members/:userId` - Remove member
- `GET /api/teams/unassigned?hackathon_id=:id` - Unassigned participants

### Exercises
- `GET /api/exercises?hackathon_id=:id` - Get exercises
- `POST /api/exercises` - Create exercise
- `POST /api/exercises/:id/assign` - Assign to teams
- `POST /api/exercises/start` - Start timer

### Submissions
- `POST /api/submissions` - Submit work (file/text/URL)
- `GET /api/submissions?hackathon_id=:id` - Get submissions
- `GET /api/submissions?ungraded=true` - Get ungraded

### Grading
- `POST /api/grades` - Grade submission
- `GET /api/grades/submission/:id` - Get grades

### Leaderboard
- `GET /api/leaderboard?hackathon_id=:id` - Get leaderboard
- `GET /api/leaderboard?podium=true` - Get top 3
- `POST /api/leaderboard/refresh` - Force update

## Complete Workflow Example

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# 2. Create hackathon
HACKATHON_ID=$(curl -s -X POST http://localhost:5000/api/hackathons \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Hackathon","description":"Testing"}' \
  | jq -r '.id')

# 3. Import participants
curl -X POST http://localhost:5000/api/users/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@backend/sample-data/participants.csv"

# 4. Create teams
TEAM1=$(curl -s -X POST http://localhost:5000/api/teams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Team Alpha\",\"hackathon_id\":$HACKATHON_ID}" \
  | jq -r '.id')

TEAM2=$(curl -s -X POST http://localhost:5000/api/teams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Team Beta\",\"hackathon_id\":$HACKATHON_ID}" \
  | jq -r '.id')

# 5. Assign members
curl -X POST "http://localhost:5000/api/teams/$TEAM1/members" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":2}'

# 6. Create exercise
EXERCISE_ID=$(curl -s -X POST http://localhost:5000/api/exercises \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"hackathon_id\":$HACKATHON_ID,\"title\":\"Build API\",\"type\":\"coding\",\"max_score\":100,\"assign_to\":\"all\"}" \
  | jq -r '.id')

# 7. Activate hackathon
curl -X PATCH "http://localhost:5000/api/hackathons/$HACKATHON_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"active"}'

# 8. View leaderboard
curl "http://localhost:5000/api/leaderboard?hackathon_id=$HACKATHON_ID" \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### Database Connection Failed

**Error**: `password authentication failed for user "postgres"`

**Solution**: Update `backend/.env` with correct PostgreSQL password:
```bash
DB_PASSWORD=your_actual_password
```

### Port Already in Use

**Error**: `Port 5000 is already in use`

**Solution**: Change port in `backend/.env`:
```bash
PORT=5001
```

### Module Not Found

**Error**: `Cannot find module...`

**Solution**: Reinstall dependencies:
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Tables Don't Exist

**Error**: `relation "users" does not exist`

**Solution**: Run migrations:
```bash
psql -d hackathon_platform -f database/migrations/001_initial_schema.sql
```

## Production Deployment

### Important Security Steps

1. **Change Admin Password**:
```sql
UPDATE users
SET password_hash = '$2a$10$new_hash_here'
WHERE username = 'admin';
```

2. **Update Environment Variables**:
```bash
NODE_ENV=production
JWT_SECRET=strong-random-secret-key-here
CORS_ORIGIN=https://yourdomain.com
```

3. **Enable HTTPS**:
   - Use reverse proxy (nginx/Apache)
   - Install SSL certificate (Let's Encrypt)

4. **Secure Database**:
   - Use strong passwords
   - Restrict network access
   - Enable SSL connections

## Next Steps

1. **Test the API**: Use the examples in `API_TESTING_GUIDE.md`
2. **Build Frontend**: Create React/Vue/Angular UI
3. **Customize**: Add features specific to your needs
4. **Deploy**: Set up on cloud (AWS/Azure/GCP)

## Documentation Files

- `README.md` - Complete project documentation
- `API_TESTING_GUIDE.md` - Detailed API examples with curl
- `QUICK_START.md` - This file
- `backend/.env.example` - Environment variables template

## Support & Development

### Running Tests
```bash
# Install dev dependencies
npm install --save-dev jest @types/jest

# Run tests
npm test
```

### Building for Production
```bash
npm run build
npm start
```

### Database Backup
```bash
pg_dump hackathon_platform > backup.sql
```

### Database Restore
```bash
psql hackathon_platform < backup.sql
```

## Features Highlights

✅ **Complete CRUD Operations** for all resources
✅ **JWT Authentication** with role-based access
✅ **Bulk User Import** via CSV
✅ **Auto-generated Credentials** (username/password)
✅ **File Upload Support** for submissions
✅ **Real-time Updates** via WebSockets
✅ **Automatic Leaderboard** calculation
✅ **Timer System** for exercises
✅ **Multi-judge Grading** with averaging
✅ **Exercise Types** (coding, study, presentation, deployment)
✅ **Podium Display** for top 3 teams
✅ **Comprehensive API** (40+ endpoints)
✅ **Database Indexes** for performance
✅ **Error Handling** throughout
✅ **TypeScript** for type safety
✅ **Production Ready** code structure

---

Happy Hacking! 🚀
