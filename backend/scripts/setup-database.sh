#!/bin/bash

# Database setup script for Hackathon Platform

echo "========================================="
echo "Hackathon Platform - Database Setup"
echo "========================================="
echo ""

# Configuration
DB_NAME="hackathon_platform"
DB_USER="postgres"

# Check if PostgreSQL is running
echo "1. Checking PostgreSQL service..."
if ! sudo service postgresql status > /dev/null 2>&1; then
    echo "   PostgreSQL is not running. Starting..."
    sudo service postgresql start
    sleep 2
fi
echo "   ✓ PostgreSQL is running"
echo ""

# Create database if it doesn't exist
echo "2. Creating database '$DB_NAME'..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME"
echo "   ✓ Database created/verified"
echo ""

# Run migrations
echo "3. Running migrations..."
sudo -u postgres psql -d $DB_NAME -f ../../database/migrations/001_initial_schema.sql
echo "   ✓ Migrations completed"
echo ""

echo "========================================="
echo "Database setup completed successfully!"
echo "========================================="
echo ""
echo "Default admin credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "IMPORTANT: Change the admin password in production!"
echo ""
