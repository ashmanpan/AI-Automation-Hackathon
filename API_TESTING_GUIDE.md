# API Testing Guide

This document provides detailed examples for testing all API endpoints using curl.

## Prerequisites

1. Backend server running on `http://localhost:5000`
2. Database set up with migrations
3. Default admin user created

## Base URL

```bash
API_URL="http://localhost:5000/api"
```

---

## 1. Authentication

### Login
```bash
# Admin login
curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Save the token from response
TOKEN="your_jwt_token_here"
```

### Get Current User
```bash
curl -X GET $API_URL/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Change Password
```bash
curl -X POST $API_URL/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "admin123",
    "newPassword": "newPassword123"
  }'
```

---

## 2. User Management

### Get All Users
```bash
curl -X GET "$API_URL/users" \
  -H "Authorization: Bearer $TOKEN"

# Filter by role
curl -X GET "$API_URL/users?role=participant" \
  -H "Authorization: Bearer $TOKEN"
```

### Get User by ID
```bash
curl -X GET "$API_URL/users/1" \
  -H "Authorization: Bearer $TOKEN"
```

### Create User (Manual)
```bash
curl -X POST $API_URL/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "password123",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "participant"
  }'
```

### Bulk Create Users from CSV
```bash
curl -X POST $API_URL/users/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@backend/sample-data/participants.csv"

# Response includes generated usernames and passwords
```

### Generate User Credentials
```bash
curl -X POST $API_URL/users/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jane Smith",
    "email": "jane@example.com",
    "role": "participant"
  }'

# Returns: { username, password, ... }
```

### Update User
```bash
curl -X PUT "$API_URL/users/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Updated Doe",
    "email": "john.updated@example.com"
  }'
```

### Delete User
```bash
curl -X DELETE "$API_URL/users/1" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 3. Hackathon Management

### Create Hackathon
```bash
curl -X POST $API_URL/hackathons \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Spring Hackathon 2024",
    "description": "A 24-hour coding competition",
    "start_time": "2024-04-01T09:00:00Z",
    "end_time": "2024-04-02T09:00:00Z"
  }'

# Save hackathon ID
HACKATHON_ID=1
```

### Get All Hackathons
```bash
curl -X GET "$API_URL/hackathons" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Active Hackathon
```bash
curl -X GET "$API_URL/hackathons/active" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Hackathon by ID
```bash
curl -X GET "$API_URL/hackathons/$HACKATHON_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Update Hackathon
```bash
curl -X PUT "$API_URL/hackathons/$HACKATHON_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Spring Hackathon 2024 - Updated",
    "description": "Updated description"
  }'
```

### Update Hackathon Status
```bash
# Activate hackathon
curl -X PATCH "$API_URL/hackathons/$HACKATHON_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active"
  }'

# Status options: draft, active, completed, cancelled
```

---

## 4. Team Management

### Create Team
```bash
curl -X POST $API_URL/teams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Team Alpha",
    "hackathon_id": 1
  }'

# Save team ID
TEAM_ID=1
```

### Get All Teams for Hackathon
```bash
curl -X GET "$API_URL/teams?hackathon_id=$HACKATHON_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Team by ID (with members)
```bash
curl -X GET "$API_URL/teams/$TEAM_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Unassigned Participants
```bash
curl -X GET "$API_URL/teams/unassigned?hackathon_id=$HACKATHON_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Add Member to Team
```bash
curl -X POST "$API_URL/teams/$TEAM_ID/members" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2
  }'
```

### Remove Member from Team
```bash
curl -X DELETE "$API_URL/teams/$TEAM_ID/members/2" \
  -H "Authorization: Bearer $TOKEN"
```

### Update Team
```bash
curl -X PUT "$API_URL/teams/$TEAM_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Team Alpha - Updated"
  }'
```

### Delete Team
```bash
curl -X DELETE "$API_URL/teams/$TEAM_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5. Exercise Management

### Create Exercise
```bash
curl -X POST $API_URL/exercises \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hackathon_id": 1,
    "title": "Build a REST API",
    "description": "Create a simple REST API with CRUD operations",
    "type": "coding",
    "max_score": 100,
    "time_limit_minutes": 120,
    "start_time": "2024-04-01T10:00:00Z",
    "assign_to": "all"
  }'

# assign_to options:
# - "all": assign to all teams
# - [1, 2, 3]: array of team IDs

EXERCISE_ID=1
```

### Get All Exercises for Hackathon
```bash
curl -X GET "$API_URL/exercises?hackathon_id=$HACKATHON_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Exercises for Specific Team
```bash
curl -X GET "$API_URL/exercises?team_id=$TEAM_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Exercise by ID
```bash
curl -X GET "$API_URL/exercises/$EXERCISE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Update Exercise
```bash
curl -X PUT "$API_URL/exercises/$EXERCISE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build a REST API - Updated",
    "max_score": 150
  }'
```

### Update Exercise Status
```bash
curl -X PATCH "$API_URL/exercises/$EXERCISE_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active"
  }'

# Status options: draft, active, completed, cancelled
```

### Assign Exercise to Teams
```bash
# Assign to all teams
curl -X POST "$API_URL/exercises/$EXERCISE_ID/assign" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assign_all": true
  }'

# Assign to specific teams
curl -X POST "$API_URL/exercises/$EXERCISE_ID/assign" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "team_ids": [1, 2, 3]
  }'
```

### Start Exercise (Participant)
```bash
curl -X POST "$API_URL/exercises/start" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "team_exercise_id": 1
  }'
```

---

## 6. Submissions

### Create Text Submission
```bash
curl -X POST $API_URL/submissions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "team_exercise_id": 1,
    "submission_type": "text",
    "content": "Here is my solution..."
  }'

SUBMISSION_ID=1
```

### Create URL Submission
```bash
curl -X POST $API_URL/submissions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "team_exercise_id": 1,
    "submission_type": "url",
    "content": "https://github.com/user/repo"
  }'
```

### Create File Submission
```bash
curl -X POST $API_URL/submissions \
  -H "Authorization: Bearer $TOKEN" \
  -F "team_exercise_id=1" \
  -F "submission_type=file" \
  -F "file=@/path/to/your/file.zip"
```

### Get All Submissions for Hackathon
```bash
curl -X GET "$API_URL/submissions?hackathon_id=$HACKATHON_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Ungraded Submissions
```bash
curl -X GET "$API_URL/submissions?hackathon_id=$HACKATHON_ID&ungraded=true" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Submission by ID
```bash
curl -X GET "$API_URL/submissions/$SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Delete Submission
```bash
curl -X DELETE "$API_URL/submissions/$SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 7. Grading

### Create/Update Grade
```bash
curl -X POST $API_URL/grades \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "submission_id": 1,
    "score": 85.5,
    "feedback": "Great work! Consider adding more error handling."
  }'
```

### Get Grades for Submission
```bash
curl -X GET "$API_URL/grades/submission/$SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Delete Grade
```bash
curl -X DELETE "$API_URL/grades/1" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 8. Leaderboard

### Get Leaderboard
```bash
# Basic leaderboard
curl -X GET "$API_URL/leaderboard?hackathon_id=$HACKATHON_ID" \
  -H "Authorization: Bearer $TOKEN"

# Detailed leaderboard (with exercise breakdown)
curl -X GET "$API_URL/leaderboard?hackathon_id=$HACKATHON_ID&detailed=true" \
  -H "Authorization: Bearer $TOKEN"

# Podium (top 3 teams)
curl -X GET "$API_URL/leaderboard?hackathon_id=$HACKATHON_ID&podium=true" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Team Rank
```bash
curl -X GET "$API_URL/leaderboard/team-rank?team_id=$TEAM_ID&hackathon_id=$HACKATHON_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Refresh Leaderboard (Force Update)
```bash
curl -X POST $API_URL/leaderboard/refresh \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hackathon_id": 1
  }'
```

---

## 9. Health Check

```bash
curl -X GET $API_URL/health
```

---

## Complete Workflow Example

Here's a complete workflow for running a hackathon:

```bash
# 1. Login as admin
TOKEN=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# 2. Create hackathon
HACKATHON_ID=$(curl -s -X POST $API_URL/hackathons \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Hackathon","description":"Test"}' \
  | jq -r '.id')

# 3. Bulk import participants
curl -X POST $API_URL/users/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@backend/sample-data/participants.csv"

# 4. Create teams
TEAM1_ID=$(curl -s -X POST $API_URL/teams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Team Alpha\",\"hackathon_id\":$HACKATHON_ID}" \
  | jq -r '.id')

TEAM2_ID=$(curl -s -X POST $API_URL/teams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Team Beta\",\"hackathon_id\":$HACKATHON_ID}" \
  | jq -r '.id')

# 5. Add members to teams
curl -X POST "$API_URL/teams/$TEAM1_ID/members" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":2}'

# 6. Create exercise
EXERCISE_ID=$(curl -s -X POST $API_URL/exercises \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"hackathon_id\":$HACKATHON_ID,\"title\":\"Build API\",\"type\":\"coding\",\"max_score\":100,\"assign_to\":\"all\"}" \
  | jq -r '.id')

# 7. Activate hackathon
curl -X PATCH "$API_URL/hackathons/$HACKATHON_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"active"}'

# 8. View leaderboard
curl -X GET "$API_URL/leaderboard?hackathon_id=$HACKATHON_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Testing Tips

1. **Save tokens**: Store JWT tokens in environment variables
2. **Use jq**: Parse JSON responses with `jq` for easier testing
3. **Check status codes**: Add `-w "\nHTTP Code: %{http_code}\n"` to curl
4. **Pretty print**: Pipe responses through `jq` for formatted output
5. **Verbose mode**: Use `-v` flag to see full request/response details

## WebSocket Testing

For testing real-time leaderboard updates, use a WebSocket client:

```javascript
const socket = io('http://localhost:5000');

// Join hackathon room
socket.emit('join-hackathon', 1);

// Listen for updates
socket.on('leaderboard-update', (data) => {
  console.log('Leaderboard updated:', data);
});
```

---

## Troubleshooting

### 401 Unauthorized
- Check if token is valid and not expired
- Ensure `Authorization: Bearer TOKEN` header is correct

### 403 Forbidden
- Check user role permissions
- Some endpoints require admin or judge role

### 404 Not Found
- Verify resource IDs exist
- Check if hackathon/team/exercise was created successfully

### 500 Internal Server Error
- Check server logs
- Verify database connection
- Ensure all required fields are provided
