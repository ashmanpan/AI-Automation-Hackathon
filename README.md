# Hackathon Management Platform

A comprehensive platform for conducting hackathons with team management, exercise tracking, AI-powered grading, and live leaderboards.

## 🚀 Quick Links

- **[AWS Amplify Deployment](DEPLOYMENT_AMPLIFY.md)** - ⭐ Recommended cloud deployment (AWS)
- **[On-Premises Deployment](DEPLOYMENT_ONPREM.md)** - Docker-based deployment with MinIO
- **[AWS Manual Deployment](DEPLOYMENT_AWS.md)** - CloudFormation/EC2 deployment (advanced)
- **[Exercise Instructions Guide](EXERCISE_INSTRUCTIONS_GUIDE.md)** - Create step-by-step exercise guides
- **[MinIO & AI Grading Guide](MINIO_AI_GRADING_GUIDE.md)** - File storage and AI grading setup
- **[API Testing Guide](API_TESTING_GUIDE.md)** - Complete API reference
- **[Quick Start Guide](QUICK_START.md)** - Get started in 5 minutes

## ✨ Features

### Core Features
- **User Management**: Bulk import participants via CSV with auto-generated credentials
- **Team Management**: Create teams and assign participants
- **Exercise System**: Create different types of exercises (coding, study, presentation, deployment)
- **📋 Step-by-Step Instructions**: Every exercise includes a detailed user guide with steps
- **📊 Grading Rubrics**: Structured evaluation criteria for consistent grading
- **Timer System**: Automatic time tracking for exercises
- **Submission System**: File uploads, text submissions, URLs, and GitHub links
- **Grading System**: Manual grading with judge feedback + AI-powered automated grading
- **Real-time Leaderboard**: Live updates using WebSockets
- **Podium Display**: Top 3 teams visualization
- **Role-based Access**: Admin, Judge, and Participant roles

### Advanced Features
- **🤖 AI Grading**: OpenAI-powered automated code review and grading
- **☁️ Cloud Storage**: Support for AWS S3 (cloud) or MinIO (on-prem)
- **📊 Real-time Updates**: WebSocket-based live leaderboard
- **🔐 Secure Authentication**: JWT-based auth with role-based access
- **📦 Dual Deployment**: Run on-premises with Docker or deploy to AWS
- **📁 File Management**: Scalable object storage for submissions

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+ with Express and TypeScript
- **Database**: PostgreSQL 15+
- **Authentication**: JWT with bcrypt password hashing
- **Real-time**: Socket.io for WebSocket connections
- **Storage**:
  - MinIO (on-premises object storage)
  - AWS S3 (cloud object storage)
  - Local filesystem (fallback)
- **AI Integration**: OpenAI GPT-4 for automated grading
- **File Uploads**: Multer middleware

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Cloud**: AWS (EC2, RDS, S3, CloudFormation)
- **Process Management**: PM2 for production
- **Reverse Proxy**: Nginx (optional)

### Frontend (to be built)
- React + TypeScript + Vite
- Socket.io-client
- React Router
- Axios for API calls

## 📋 Prerequisites

### For Local Development
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### For Docker Deployment
- Docker (v20.10+)
- Docker Compose (v2.0+)

### For AWS Deployment
- AWS Account
- AWS CLI configured
- EC2 Key Pair (for SSH)

## 🚀 Deployment Options

### Option 1: AWS Amplify ⭐ (Recommended for Production)

**Fully managed cloud deployment with automatic CI/CD**

Best for:
- ✅ Production environments
- ✅ Automatic scaling and deployment
- ✅ Teams wanting minimal DevOps overhead
- ✅ Projects needing SSL/CDN out of the box

**Setup Time**: 20 minutes
**Cost**: ~$40-60/month
**Effort**: Low (managed service)

See **[AWS Amplify Deployment Guide](DEPLOYMENT_AMPLIFY.md)** for detailed instructions.

**Key Benefits**:
- 🚀 Deploy directly from GitHub
- 🔄 Automatic deployments on git push
- 🌐 Built-in CloudFront CDN
- 🔒 Automatic SSL certificates
- 📊 Integrated monitoring
- ↩️ One-click rollbacks

```bash
# Quick steps:
1. Push code to GitHub
2. Connect repository in Amplify Console
3. Configure environment variables (RDS, S3, OpenAI)
4. Deploy!
```

### Option 2: On-Premises (Recommended for Development)

**Docker-based deployment with MinIO for file storage**

Best for:
- 💻 Local development and testing
- 🏢 Organizations with existing infrastructure
- 🔐 Data sovereignty requirements
- 💰 Zero cloud costs

**Setup Time**: 10 minutes
**Cost**: Free (uses your infrastructure)
**Effort**: Low

See **[On-Premises Deployment Guide](DEPLOYMENT_ONPREM.md)** for detailed instructions.

```bash
# Quick start
git clone <repository-url>
cd CiscoSP-Hackathon
docker-compose up -d postgres minio
cd backend && npm install && npm run migrate
npm run dev
```

### Option 3: AWS Manual Deployment (Advanced)

**CloudFormation/EC2-based deployment for full control**

Best for:
- 🎛️ Teams needing full infrastructure control
- 🔧 Custom networking/security requirements
- 🏗️ Integration with existing AWS infrastructure

**Setup Time**: 45 minutes
**Cost**: ~$50-100/month
**Effort**: High (self-managed)

See **[AWS Manual Deployment Guide](DEPLOYMENT_AWS.md)** for detailed instructions.

```bash
# Quick Deploy with CloudFormation:
aws cloudformation create-stack \
  --stack-name hackathon-platform \
  --template-body file://aws-deployment/cloudformation/hackathon-infrastructure.yaml \
  --parameters ParameterKey=KeyPairName,ParameterValue=your-key \
               ParameterKey=DBPassword,ParameterValue=your-password \
  --capabilities CAPABILITY_NAMED_IAM
```

---

### Comparison Table

| Feature | AWS Amplify ⭐ | On-Premises | AWS Manual |
|---------|---------------|-------------|------------|
| Setup Time | 20 min | 10 min | 45 min |
| Maintenance | Managed | Self | Self |
| CI/CD | ✅ Automatic | ❌ Manual | ❌ Manual |
| Scaling | ✅ Automatic | ❌ Manual | ⚠️ Manual |
| SSL/CDN | ✅ Included | ❌ DIY | ❌ DIY |
| Cost/Month | $40-60 | $0 | $50-100 |
| Best For | Production | Development | Enterprise |

**👉 Recommendation**: Use **AWS Amplify** for production, **On-Premises** for development.

## 📦 Installation (Local Development)

### 1. Clone the repository

```bash
git clone <repository-url>
cd CiscoSP-Hackathon
```

### 2. Set up PostgreSQL

Create a new database:

```bash
psql -U postgres
CREATE DATABASE hackathon_platform;
\q
```

Run the migration to create tables:

```bash
psql -U postgres -d hackathon_platform -f database/migrations/001_initial_schema.sql
```

### 3. Set up Backend

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hackathon_platform
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_secret_key_change_in_production
JWT_EXPIRES_IN=24h

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 4. Start the Backend

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/change-password` - Change password

### Users
- `GET /api/users` - Get all users (Admin/Judge)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (Admin)
- `POST /api/users/bulk` - Bulk create users from CSV (Admin)
- `POST /api/users/generate` - Generate credentials (Admin)
- `PUT /api/users/:id` - Update user (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)

### Hackathons
- `GET /api/hackathons` - Get all hackathons
- `GET /api/hackathons/active` - Get active hackathon
- `GET /api/hackathons/:id` - Get hackathon by ID
- `POST /api/hackathons` - Create hackathon (Admin)
- `PUT /api/hackathons/:id` - Update hackathon (Admin)
- `PATCH /api/hackathons/:id/status` - Update status (Admin)
- `DELETE /api/hackathons/:id` - Delete hackathon (Admin)

### Teams
- `GET /api/teams?hackathon_id=:id` - Get all teams
- `GET /api/teams/unassigned?hackathon_id=:id` - Get unassigned participants
- `GET /api/teams/:id` - Get team with members
- `POST /api/teams` - Create team (Admin)
- `PUT /api/teams/:id` - Update team (Admin)
- `DELETE /api/teams/:id` - Delete team (Admin)
- `POST /api/teams/:id/members` - Add member (Admin)
- `DELETE /api/teams/:id/members/:userId` - Remove member (Admin)

### Exercises
- `GET /api/exercises?hackathon_id=:id` - Get all exercises
- `GET /api/exercises?team_id=:id` - Get team's exercises
- `GET /api/exercises/:id` - Get exercise by ID
- `POST /api/exercises` - Create exercise (Admin)
- `PUT /api/exercises/:id` - Update exercise (Admin)
- `PATCH /api/exercises/:id/status` - Update status (Admin)
- `DELETE /api/exercises/:id` - Delete exercise (Admin)
- `POST /api/exercises/:id/assign` - Assign to teams (Admin)
- `POST /api/exercises/start` - Start exercise (Participant)

### Submissions
- `GET /api/submissions?hackathon_id=:id` - Get all submissions
- `GET /api/submissions?hackathon_id=:id&ungraded=true` - Get ungraded
- `GET /api/submissions/:id` - Get submission by ID
- `POST /api/submissions` - Create submission (Participant)
- `DELETE /api/submissions/:id` - Delete submission (Admin)

### Grades
- `POST /api/grades` - Create/update grade (Admin/Judge)
- `GET /api/grades/submission/:submission_id` - Get grades for submission
- `DELETE /api/grades/:id` - Delete grade (Admin/Judge)

### Leaderboard
- `GET /api/leaderboard?hackathon_id=:id` - Get leaderboard
- `GET /api/leaderboard?hackathon_id=:id&detailed=true` - Get detailed
- `GET /api/leaderboard?hackathon_id=:id&podium=true` - Get top 3
- `GET /api/leaderboard/team-rank?team_id=:id&hackathon_id=:id` - Get team rank
- `POST /api/leaderboard/refresh` - Refresh leaderboard (Admin)

### AI Grading (OpenAI Integration)
- `GET /api/ai-grading/status` - Check if AI grading is available
- `POST /api/ai-grading/grade` - Grade single submission with AI
- `POST /api/ai-grading/batch` - Batch grade all ungraded submissions
- `POST /api/ai-grading/analyze` - Analyze code without grading
- `POST /api/ai-grading/regrade` - Re-grade a submission
- `GET /api/ai-grading/stats` - Get grading statistics

**See [MinIO & AI Grading Guide](MINIO_AI_GRADING_GUIDE.md) for detailed usage.**

## CSV Format for Bulk User Import

Create a CSV file with the following columns:

```csv
full_name,email,role
John Doe,john@example.com,participant
Jane Smith,jane@example.com,participant
Bob Judge,bob@example.com,judge
```

- `full_name` (required): Full name of the participant
- `email` (optional): Email address
- `role` (optional): Defaults to 'participant' (can be: participant, judge, admin)

Usernames and passwords will be auto-generated and returned in the API response.

## Default Admin Credentials

- Username: `admin`
- Password: `admin123`

**Change this immediately in production!**

## WebSocket Events

Connect to the WebSocket server at `http://localhost:5000`

### Client Events
- `join-hackathon` - Join a hackathon room for real-time updates
- `leave-hackathon` - Leave a hackathon room

### Server Events
- `leaderboard-update` - Sent when leaderboard changes
- `exercise-update` - Sent when exercise status changes

## Project Structure

```
CiscoSP-Hackathon/
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helpers
│   │   └── server.ts       # Entry point
│   ├── uploads/            # File storage
│   └── package.json
├── frontend/               # React app (to be built)
├── database/
│   └── migrations/         # SQL schema
└── README.md
```

## Development Workflow

1. **Create a hackathon**
   - POST to `/api/hackathons` with name and details

2. **Import participants**
   - POST CSV to `/api/users/bulk`
   - Download generated credentials

3. **Create teams**
   - POST to `/api/teams` for each team
   - POST to `/api/teams/:id/members` to add participants

4. **Create exercises**
   - POST to `/api/exercises` with exercise details
   - Assign to teams using `assign_to` parameter

5. **Activate hackathon**
   - PATCH `/api/hackathons/:id/status` with status: 'active'

6. **Participants submit work**
   - POST to `/api/submissions` with file/text/URL

7. **Judges grade submissions**
   - POST to `/api/grades` with score and feedback

8. **View leaderboard**
   - GET `/api/leaderboard?hackathon_id=:id`

## Security Notes

- Always use HTTPS in production
- Change default admin password immediately
- Use strong JWT secrets
- Validate file uploads
- Set appropriate file size limits
- Use environment variables for sensitive data

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `sudo service postgresql status`
- Check credentials in `.env` file
- Ensure database exists: `psql -U postgres -l`

### Port Already in Use
- Change PORT in `.env` file
- Kill process using port: `lsof -ti:5000 | xargs kill`

### File Upload Errors
- Check uploads directory exists and has write permissions
- Verify MAX_FILE_SIZE in `.env`

## Future Enhancements

- [ ] Automated testing
- [ ] Code execution for coding exercises
- [ ] Team chat functionality
- [ ] Email notifications
- [ ] Analytics dashboard
- [ ] Export hackathon results
- [ ] Multi-hackathon support
- [ ] Mobile app

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
