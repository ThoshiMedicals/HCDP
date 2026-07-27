-- Wave 1A: Authentication & user provisioning (current HCDP stack)
-- Portable PostgreSQL — NOT Supabase-specific.
-- Verified Wave 0/1A audit: no local auth.users table exists today.
-- Identity linkage uses auth_identity_id (unique external/demo subject), not a false FK.

-- 1. Base account role enum (validated; prevents typos)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'manager', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Organisations / clinics (tenant + scope)
CREATE TABLE IF NOT EXISTS public.organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, code)
);

-- 3. Application profiles
-- base role = user_role enum ONLY — detailed access lives in assignment tables below
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- No local auth user table in current stack: store real identity subject uniquely
  auth_identity_id TEXT UNIQUE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'Invited'
    CHECK (status IN (
      'Draft',
      'Pending Approval',
      'Invited',
      'Active',
      'Suspended',
      'Locked',
      'Offboarding',
      'Archived'
    )),
  display_name TEXT NOT NULL DEFAULT '',
  organisation_id UUID NOT NULL REFERENCES public.organisations(id),
  workforce_person_id TEXT NULL,
  manager_profile_id UUID NULL REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, email)
);

CREATE INDEX IF NOT EXISTS profiles_org_idx ON public.profiles (organisation_id);
CREATE INDEX IF NOT EXISTS profiles_auth_identity_idx ON public.profiles (auth_identity_id);

-- 4. Detailed access model (not replaced by profiles.role)
CREATE TABLE IF NOT EXISTS public.organisation_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  membership_status TEXT NOT NULL DEFAULT 'active',
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.detailed_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, code)
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NULL,
  category TEXT NOT NULL DEFAULT 'general'
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.detailed_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.detailed_roles(id),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id),
  clinic_id UUID NULL REFERENCES public.clinics(id),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ NULL,
  assigned_by UUID NULL REFERENCES public.profiles(id),
  reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_clinic_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id),
  access_level TEXT NOT NULL DEFAULT 'standard'
    CHECK (access_level IN ('read', 'standard', 'manager', 'admin')),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ NULL,
  assigned_by UUID NULL REFERENCES public.profiles(id),
  reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id),
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  base_role user_role NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'Draft'
    CHECK (status IN (
      'Draft',
      'Pending Approval',
      'Ready to Send',
      'Invited',
      'Delivered',
      'Accepted',
      'Expired',
      'Cancelled',
      'Failed'
    )),
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  profile_id UUID NULL REFERENCES public.profiles(id),
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ NULL,
  cancelled_at TIMESTAMPTZ NULL,
  last_sent_at TIMESTAMPTZ NULL,
  send_attempts INT NOT NULL DEFAULT 0,
  intended_detailed_role_ids UUID[] NOT NULL DEFAULT '{}',
  intended_clinic_ids UUID[] NOT NULL DEFAULT '{}',
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.access_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id),
  actor_profile_id UUID NULL REFERENCES public.profiles(id),
  subject_profile_id UUID NULL REFERENCES public.profiles(id),
  change_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NULL,
  before_state JSONB NULL,
  after_state JSONB NULL,
  reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.access_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id),
  subject_profile_id UUID NOT NULL REFERENCES public.profiles(id),
  reviewer_profile_id UUID NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'Open',
  due_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id),
  from_profile_id UUID NOT NULL REFERENCES public.profiles(id),
  to_profile_id UUID NOT NULL REFERENCES public.profiles(id),
  permission_codes TEXT[] NOT NULL DEFAULT '{}',
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ NULL,
  reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.password_reset_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NULL REFERENCES public.organisations(id),
  profile_id UUID NULL REFERENCES public.profiles(id),
  email TEXT NOT NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('requested', 'email_sent', 'completed', 'failed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.permissions (code, name, category) VALUES
  ('users.invite', 'Invite users', 'identity'),
  ('users.manage', 'Manage users and access', 'identity'),
  ('users.view', 'View users', 'identity'),
  ('roles.manage', 'Manage roles', 'identity'),
  ('access.review', 'Complete access reviews', 'identity'),
  ('org.admin', 'Organisation administrator', 'identity')
ON CONFLICT (code) DO NOTHING;
