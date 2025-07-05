-- Create additional PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search
CREATE EXTENSION IF NOT EXISTS "unaccent";  -- For case-insensitive search

-- Create a read-only user for reporting
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'readonly') THEN
        CREATE ROLE readonly WITH LOGIN PASSWORD '${READONLY_PASSWORD:-readonly_password}';
        GRANT CONNECT ON DATABASE ${POSTGRES_DB:-floreria_cristina} TO readonly;
        GRANT USAGE ON SCHEMA public TO readonly;
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly;
    END IF;
END
$$;

-- Create a read-write user for the application
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${POSTGRES_USER:-floradmin}') THEN
        CREATE ROLE ${POSTGRES_USER:-floradmin} WITH LOGIN PASSWORD '${POSTGRES_PASSWORD:-florpassword}';
        GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB:-floreria_cristina} TO ${POSTGRES_USER:-floradmin};
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${POSTGRES_USER:-floradmin};
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${POSTGRES_USER:-floradmin};
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO ${POSTGRES_USER:-floradmin};
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO ${POSTGRES_USER:-floradmin};
    END IF;
END
$$;

-- Configure database parameters for better performance
ALTER SYSTEM SET shared_buffers = '512MB';
ALTER SYSTEM SET effective_cache_size = '1536MB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
ALTER SYSTEM SET work_mem = '32MB';
ALTER SYSTEM SET max_worker_processes = '4';
ALTER SYSTEM SET max_parallel_workers_per_gather = '2';
ALTER SYSTEM SET max_parallel_workers = '4';
ALTER SYSTEM SET random_page_cost = '1.1';
ALTER SYSTEM SET effective_io_concurrency = '200';
ALTER SYSTEM SET timezone = 'America/Argentina/Buenos_Aires';
ALTER SYSTEM SET lc_messages = 'es_AR.UTF-8';
ALTER SYSTEM SET lc_monetary = 'es_AR.UTF-8';
ALTER SYSTEM SET lc_numeric = 'es_AR.UTF-8';
ALTER SYSTEM SET lc_time = 'es_AR.UTF-8';

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
