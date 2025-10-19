-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'judge', 'participant')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Hackathons Table
CREATE TABLE IF NOT EXISTS hackathons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    hackathon_id INTEGER REFERENCES hackathons(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, hackathon_id)
);

-- Create Team Members Junction Table
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id)
);

-- Create Exercises Table
CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    hackathon_id INTEGER REFERENCES hackathons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(30) NOT NULL CHECK (type IN ('coding', 'study', 'presentation', 'deployment', 'other')),
    max_score INTEGER NOT NULL DEFAULT 100,
    time_limit_minutes INTEGER,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Team Exercises Junction Table (tracks which teams have which exercises)
CREATE TABLE IF NOT EXISTS team_exercises (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'graded')),
    started_at TIMESTAMP,
    UNIQUE(team_id, exercise_id)
);

-- Create Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    team_exercise_id INTEGER REFERENCES team_exercises(id) ON DELETE CASCADE,
    submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    submission_type VARCHAR(20) NOT NULL CHECK (submission_type IN ('file', 'text', 'url', 'github')),
    content TEXT,
    file_path VARCHAR(500),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Grades Table
CREATE TABLE IF NOT EXISTS grades (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
    graded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    score DECIMAL(5,2) NOT NULL,
    feedback TEXT,
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(submission_id, graded_by)
);

-- Create Leaderboard Table
CREATE TABLE IF NOT EXISTS leaderboard (
    id SERIAL PRIMARY KEY,
    hackathon_id INTEGER REFERENCES hackathons(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    total_score DECIMAL(10,2) DEFAULT 0,
    rank INTEGER,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hackathon_id, team_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_teams_hackathon ON teams(hackathon_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_exercises_hackathon ON exercises(hackathon_id);
CREATE INDEX idx_exercises_status ON exercises(status);
CREATE INDEX idx_team_exercises_team ON team_exercises(team_id);
CREATE INDEX idx_team_exercises_exercise ON team_exercises(exercise_id);
CREATE INDEX idx_team_exercises_status ON team_exercises(status);
CREATE INDEX idx_submissions_team_exercise ON submissions(team_exercise_id);
CREATE INDEX idx_grades_submission ON grades(submission_id);
CREATE INDEX idx_leaderboard_hackathon ON leaderboard(hackathon_id);
CREATE INDEX idx_leaderboard_rank ON leaderboard(rank);

-- Insert a default admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (username, password_hash, email, full_name, role)
VALUES ('admin', '$2a$10$4xZfGwQkZoNTodofktfg2uwOXkBrfy2wZMIquiFmxnDVGFSXIMpOO', 'admin@hackathon.com', 'System Administrator', 'admin')
ON CONFLICT (username) DO NOTHING;
