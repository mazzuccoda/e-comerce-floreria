#!/bin/bash
set -e

# Crear la base de datos si no existe
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    CREATE DATABASE $POSTGRES_DB;
EOSQL

# Ejecutar el resto del script en la base de datos correcta
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Conectarse a la base de datos
    \c $POSTGRES_DB
    
    -- Crear extensiones
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    CREATE EXTENSION IF NOT EXISTS "unaccent";
    
    -- Crear usuario de solo lectura
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'readonly') THEN
            CREATE ROLE readonly WITH LOGIN PASSWORD 'readonly_password';
            GRANT CONNECT ON DATABASE $POSTGRES_DB TO readonly;
            GRANT USAGE ON SCHEMA public TO readonly;
            GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly;
        END IF;
    END
    \$\$;
    
    -- Configurar parámetros de rendimiento
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
    
    -- Función para actualizar la columna updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS \$\$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    \$\$ LANGUAGE plpgsql;
EOSQL
