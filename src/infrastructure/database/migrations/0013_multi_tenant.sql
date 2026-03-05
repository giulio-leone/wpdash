-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  avatar_url TEXT,
  plan VARCHAR(20) NOT NULL DEFAULT 'free',
  sites_limit INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Org members
CREATE TABLE IF NOT EXISTS org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  invite_email TEXT,
  invite_token TEXT,
  invite_accepted BOOLEAN NOT NULL DEFAULT false,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- User plans
CREATE TABLE IF NOT EXISTS user_plans (
  user_id UUID PRIMARY KEY,
  plan VARCHAR(20) NOT NULL DEFAULT 'free',
  sites_limit INTEGER NOT NULL DEFAULT 3,
  trial_expires_at TIMESTAMPTZ,
  upgraded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add org_id to sites (nullable — personal sites have NULL, org sites have org_id)
ALTER TABLE sites ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
