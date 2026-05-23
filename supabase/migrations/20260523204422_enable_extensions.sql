-- Extensions de base
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- pg_cron pour tâches planifiées
CREATE EXTENSION IF NOT EXISTS "pg_cron";