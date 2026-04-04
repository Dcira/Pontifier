-- Reference snapshot only. Source of truth: prisma/schema.prisma — apply with `npm run db:migrate` or `npm run db:migrate:deploy`.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('admin', 'college_manager', 'team_member');

CREATE TYPE delegate_status AS ENUM ('confirmed', 'soft_yes', 'cold', 'lost');

CREATE TYPE register_outcome AS ENUM ('confirmed', 'soft_yes', 'no_response', 'rejected');

CREATE TABLE colleges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  college_id INTEGER REFERENCES colleges (id),
  is_first_login BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users (id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  CONSTRAINT users_college_manager_college_chk CHECK (
    (role = 'college_manager' AND college_id IS NOT NULL)
    OR (role <> 'college_manager' AND college_id IS NULL)
  )
);

CREATE TABLE delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  college_id INTEGER NOT NULL REFERENCES colleges (id),
  contact VARCHAR(20),
  notes TEXT,
  status delegate_status DEFAULT 'soft_yes',
  added_by UUID REFERENCES users (id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE delegate_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegate_id UUID NOT NULL REFERENCES delegates (id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users (id),
  assigned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  UNIQUE (delegate_id, team_member_id)
);

CREATE TABLE daily_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegate_id UUID NOT NULL REFERENCES delegates (id) ON DELETE CASCADE,
  contacted_by UUID REFERENCES users (id),
  contact_date DATE NOT NULL,
  was_contacted BOOLEAN DEFAULT FALSE,
  outcome register_outcome,
  notes TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  UNIQUE (delegate_id, contact_date, contacted_by)
);

CREATE TABLE status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegate_id UUID NOT NULL REFERENCES delegates (id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES users (id),
  changed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  notes TEXT
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  is_revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_daily_register_delegate_date ON daily_register (delegate_id, contact_date);

CREATE INDEX idx_daily_register_contacted_by ON daily_register (contacted_by);

CREATE INDEX idx_delegates_college ON delegates (college_id);

CREATE INDEX idx_delegates_status ON delegates (status);

CREATE INDEX idx_delegate_assignments_team ON delegate_assignments (team_member_id);

CREATE INDEX idx_delegate_assignments_delegate ON delegate_assignments (delegate_id);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens (token);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);
