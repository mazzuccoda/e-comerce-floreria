#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 <<-EOSQL
    CREATE USER postgres WITH SUPERUSER PASSWORD 'postgres';
    CREATE USER floradmin WITH SUPERUSER PASSWORD 'florpassword';
    CREATE DATABASE floreria_cristina OWNER floradmin;
EOSQL
