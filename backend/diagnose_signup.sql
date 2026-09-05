-- =============================================================================
-- DIAGNOSE: Run this in Supabase SQL Editor to find signup 500 root cause
-- Copy the results and share if sign-up still fails.
-- =============================================================================

-- A) Does profiles table exist and look correct?
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- B) Is the trigger attached to auth.users?
SELECT tgname AS trigger_name, tgenabled AS enabled
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'auth' AND c.relname = 'users' AND NOT t.tgisinternal;

-- C) Show trigger function definition
SELECT pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'handle_new_user';

-- D) Any duplicate/broken profiles blocking inserts?
SELECT COUNT(*) AS profile_count FROM public.profiles;

-- E) Recent auth users without profiles (signups that partially failed earlier)
SELECT u.id, u.email, u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC
LIMIT 10;
