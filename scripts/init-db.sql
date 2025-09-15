-- Database initialization script for local development
-- This script runs when the PostgreSQL container starts for the first time

-- Create the main database (if it doesn't exist)
-- Note: POSTGRES_DB environment variable already creates the database,
-- but we can add additional setup here if needed

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a test user (optional)
-- DO $$ 
-- BEGIN
--   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'test_user') THEN
--     CREATE ROLE test_user WITH LOGIN PASSWORD 'test_password';
--   END IF;
-- END
-- $$;

-- Grant permissions (optional)
-- GRANT ALL PRIVILEGES ON DATABASE ie_professors_db TO test_user;

-- Log successful initialization
SELECT 'Database initialization completed successfully!' as message;
