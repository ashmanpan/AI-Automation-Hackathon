-- Create databases for local development
-- This runs automatically when the Docker container first starts

-- Main database (already created by POSTGRES_DB env var)
-- hackathon_platform

-- Test database for local development
CREATE DATABASE hackathon_platform_test;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hackathon_platform TO postgres;
GRANT ALL PRIVILEGES ON DATABASE hackathon_platform_test TO postgres;
