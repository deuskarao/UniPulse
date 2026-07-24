-- UniPulse remote public schema baseline.
-- Generated from the linked Supabase project to mirror pre-existing remote migrations.
-- Data rows are intentionally not included.

set check_function_bodies = off;

create schema if not exists "public";

create table if not exists "public"."activity_logs" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid,
  "action" text not null,
  "details" jsonb default '{}'::jsonb,
  "ip_address" text,
  "created_at" timestamp with time zone default now()
);

create table if not exists "public"."admin_notes" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid,
  "admin_id" uuid,
  "content" text not null,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now()
);

create table if not exists "public"."classes" (
  "id" uuid default gen_random_uuid() not null,
  "department_id" uuid,
  "name" text not null,
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists "public"."default_course" (
  "id" uuid default gen_random_uuid() not null,
  "key" character varying not null,
  "value" jsonb not null,
  "created_at" timestamp with time zone default now()
);

create table if not exists "public"."department_courses" (
  "id" uuid default gen_random_uuid() not null,
  "department_id" uuid not null,
  "legacy_id" integer,
  "ad" text not null,
  "kredi" numeric default 0 not null,
  "ders_saati" numeric default 0 not null,
  "vize_yuzde" numeric default 0.4 not null,
  "odev_yuzde" numeric default 0 not null,
  "final_yuzde" numeric default 0.6 not null,
  "donem" integer not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "proje_yuzde" numeric default 0,
  "ad_en" text,
  "ad_es" text,
  "ad_it" text,
  "ad_ru" text
);

create table if not exists "public"."departments" (
  "id" uuid default gen_random_uuid() not null,
  "slug" text not null,
  "ad" text not null,
  "aciklama" text,
  "toplam_kredi" integer default 0 not null,
  "toplam_donem" integer default 8 not null,
  "ikon" text,
  "renk" text,
  "created_at" timestamp with time zone default now() not null,
  "ad_en" text,
  "ad_es" text,
  "ad_it" text,
  "ad_ru" text
);

create table if not exists "public"."faculties" (
  "id" uuid default gen_random_uuid() not null,
  "ad" character varying not null,
  "emoji" character varying not null,
  "renk" character varying not null,
  "slug" character varying not null,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  "university_id" uuid,
  "ad_en" text,
  "ad_es" text,
  "ad_it" text,
  "ad_ru" text
);

create table if not exists "public"."faculty_departments" (
  "id" uuid default gen_random_uuid() not null,
  "faculty_id" uuid not null,
  "department_slug" character varying not null,
  "created_at" timestamp with time zone default now()
);

create table if not exists "public"."gano_renkler" (
  "id" uuid default gen_random_uuid() not null,
  "min_gano" numeric(3,2) not null,
  "renk" character varying(7) not null,
  "created_at" timestamp with time zone default now()
);

create table if not exists "public"."harf_notlari" (
  "id" uuid default gen_random_uuid() not null,
  "harf" character varying(2) not null,
  "katsayi" numeric(3,1) not null,
  "min" integer not null,
  "created_at" timestamp with time zone default now()
);

create table if not exists "public"."harf_renkler" (
  "id" uuid default gen_random_uuid() not null,
  "harf" character varying(2) not null,
  "renk" character varying(7) not null,
  "created_at" timestamp with time zone default now()
);

create table if not exists "public"."profiles" (
  "id" uuid not null,
  "department_id" uuid,
  "full_name" text,
  "email" text,
  "aktif_program_donemi" integer default 1,
  "created_at" timestamp with time zone default now() not null,
  "role" text default 'user'::text,
  "is_approved" boolean default false,
  "is_allowed" boolean default true,
  "updated_at" timestamp with time zone default now() not null,
  "theme_preference" text default 'dark'::text,
  "university_id" uuid,
  "faculty_id" uuid,
  "username" text,
  "hedef_gano" numeric(3,2) default 3.00,
  "is_online" boolean default false,
  "class_id" uuid,
  "enrollment_year" integer,
  "gpa" numeric(3,2) default 0,
  "total_credits" integer default 0,
  "course_count" integer default 0
);

create table if not exists "public"."student_grades" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "department_course_id" uuid not null,
  "vize" numeric,
  "odev" numeric,
  "final" numeric,
  "harf_notu" text,
  "updated_at" timestamp with time zone default now() not null,
  "created_at" timestamp with time zone default now(),
  "proje" numeric,
  "bute_kaldi" boolean default false,
  "but" double precision default 0
);

create table if not exists "public"."universities" (
  "id" uuid default gen_random_uuid() not null,
  "ad" text not null,
  "emoji" text default '🏛️'::text not null,
  "renk" character varying(7) default '#6366f1'::character varying not null,
  "slug" text not null,
  "aciklama" text,
  "created_at" timestamp with time zone default now() not null,
  "domain" text,
  "ad_en" text,
  "ad_es" text,
  "ad_it" text,
  "ad_ru" text
);

create table if not exists "public"."user_notifications" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid,
  "title" text not null,
  "message" text not null,
  "is_read" boolean default false,
  "type" text default 'info'::text,
  "created_at" timestamp with time zone default now()
);

CREATE OR REPLACE FUNCTION public.delete_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$function$

CREATE OR REPLACE FUNCTION public.delete_user(target_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF target_id = auth.uid() THEN
    RAISE EXCEPTION 'Admin cannot delete own user';
  END IF;

  DELETE FROM public.student_grades WHERE user_id = target_id;
  DELETE FROM public.profiles WHERE id = target_id;
END;
$function$

CREATE OR REPLACE FUNCTION public.get_class_leaderboard(p_department_id uuid, p_enrollment_year integer)
 RETURNS TABLE(id uuid, full_name text, username text, is_online boolean, enrollment_year integer, gpa numeric, total_credits integer, course_count integer, department_name text, faculty_name text, university_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return query
  select
    p.id,
    p.full_name::text,
    p.username::text,
    p.is_online::boolean,
    p.enrollment_year::integer,
    coalesce(p.gpa, 0)::numeric,
    coalesce(p.total_credits, 0)::integer,
    coalesce(p.course_count, 0)::integer,
    d.ad::text as department_name,
    f.ad::text as faculty_name,
    coalesce(u_profile.ad, u_faculty.ad)::text as university_name
  from profiles p
  left join departments d on p.department_id = d.id
  left join faculties f on p.faculty_id = f.id
  left join universities u_profile on p.university_id = u_profile.id
  left join universities u_faculty on f.university_id = u_faculty.id
  where p.department_id = p_department_id
    and p.enrollment_year = p_enrollment_year
    and coalesce(p.username, '') not in ('demo', 'admin')
    and coalesce(p.role, 'user') <> 'admin'
  order by coalesce(p.gpa, 0) desc, coalesce(p.total_credits, 0) desc, p.created_at asc;
end;
$function$

CREATE OR REPLACE FUNCTION public.get_course_leaderboard(p_department_id uuid, p_enrollment_year integer, p_course_id uuid)
 RETURNS TABLE(user_id uuid, full_name text, username text, is_online boolean, department_name text, faculty_name text, enrollment_year integer, vize double precision, odev double precision, proje double precision, final double precision, but double precision, harf_notu text, sort_score double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return query
  select
    p.id::uuid as user_id,
    p.full_name::text,
    p.username::text,
    p.is_online::boolean,
    d.ad::text as department_name,
    f.ad::text as faculty_name,
    p.enrollment_year::integer,
    sg.vize::double precision,
    sg.odev::double precision,
    sg.proje::double precision,
    sg.final::double precision,
    sg.but::double precision,
    sg.harf_notu::text,
    (
      coalesce(sg.vize, 0) * coalesce(dc.vize_yuzde, 0) +
      coalesce(sg.odev, 0) * coalesce(dc.odev_yuzde, 0) +
      coalesce(sg.proje, 0) * coalesce(dc.proje_yuzde, 0) +
      (case when coalesce(sg.bute_kaldi, false) then coalesce(sg.but, 0) else coalesce(sg.final, 0) end) * coalesce(dc.final_yuzde, 0)
    )::double precision as sort_score
  from profiles p
  join student_grades sg on sg.user_id = p.id
  join department_courses dc on sg.department_course_id = dc.id
  left join departments d on p.department_id = d.id
  left join faculties f on p.faculty_id = f.id
  where p.department_id = p_department_id
    and p.enrollment_year = p_enrollment_year
    and dc.id = p_course_id
    and coalesce(p.username, '') not in ('demo', 'admin')
    and coalesce(p.role, 'user') <> 'admin'
  order by sort_score desc, p.created_at asc;
end;
$function$

CREATE OR REPLACE FUNCTION public.get_department_leaderboard(p_department_id uuid)
 RETURNS TABLE(id uuid, full_name text, username text, is_online boolean, enrollment_year integer, gpa numeric, total_credits integer, course_count integer, department_name text, faculty_name text, university_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return query
  select
    p.id,
    p.full_name::text,
    p.username::text,
    p.is_online::boolean,
    p.enrollment_year::integer,
    coalesce(p.gpa, 0)::numeric,
    coalesce(p.total_credits, 0)::integer,
    coalesce(p.course_count, 0)::integer,
    d.ad::text as department_name,
    f.ad::text as faculty_name,
    coalesce(u_profile.ad, u_faculty.ad)::text as university_name
  from profiles p
  left join departments d on p.department_id = d.id
  left join faculties f on p.faculty_id = f.id
  left join universities u_profile on p.university_id = u_profile.id
  left join universities u_faculty on f.university_id = u_faculty.id
  where p.department_id = p_department_id
    and coalesce(p.username, '') not in ('demo', 'admin')
    and coalesce(p.role, 'user') <> 'admin'
  order by coalesce(p.gpa, 0) desc, coalesce(p.total_credits, 0) desc, p.created_at asc;
end;
$function$

CREATE OR REPLACE FUNCTION public.get_email_by_full_name(p_name text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email FROM public.profiles 
  WHERE full_name = p_name OR username = p_name 
  LIMIT 1;
  RETURN v_email;
END;
$function$

CREATE OR REPLACE FUNCTION public.get_faculty_leaderboard(p_faculty_id uuid)
 RETURNS TABLE(id uuid, full_name text, username text, is_online boolean, enrollment_year integer, gpa numeric, total_credits integer, course_count integer, department_name text, faculty_name text, university_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return query
  select
    p.id,
    p.full_name::text,
    p.username::text,
    p.is_online::boolean,
    p.enrollment_year::integer,
    coalesce(p.gpa, 0)::numeric,
    coalesce(p.total_credits, 0)::integer,
    coalesce(p.course_count, 0)::integer,
    d.ad::text as department_name,
    f.ad::text as faculty_name,
    coalesce(u_profile.ad, u_faculty.ad)::text as university_name
  from profiles p
  left join departments d on p.department_id = d.id
  left join faculties f on p.faculty_id = f.id
  left join universities u_profile on p.university_id = u_profile.id
  left join universities u_faculty on f.university_id = u_faculty.id
  where p.faculty_id = p_faculty_id
    and coalesce(p.username, '') not in ('demo', 'admin')
    and coalesce(p.role, 'user') <> 'admin'
  order by coalesce(p.gpa, 0) desc, coalesce(p.total_credits, 0) desc, p.created_at asc;
end;
$function$

CREATE OR REPLACE FUNCTION public.get_university_leaderboard(p_university_id uuid)
 RETURNS TABLE(id uuid, full_name text, username text, is_online boolean, enrollment_year integer, gpa numeric, total_credits integer, course_count integer, department_name text, faculty_name text, university_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return query
  select
    p.id,
    p.full_name::text,
    p.username::text,
    p.is_online::boolean,
    p.enrollment_year::integer,
    coalesce(p.gpa, 0)::numeric,
    coalesce(p.total_credits, 0)::integer,
    coalesce(p.course_count, 0)::integer,
    d.ad::text as department_name,
    f.ad::text as faculty_name,
    coalesce(u_profile.ad, u_faculty.ad)::text as university_name
  from profiles p
  left join departments d on p.department_id = d.id
  left join faculties f on p.faculty_id = f.id
  left join universities u_profile on p.university_id = u_profile.id
  left join universities u_faculty on f.university_id = u_faculty.id
  where coalesce(p.university_id, f.university_id) = p_university_id
    and coalesce(p.username, '') not in ('demo', 'admin')
    and coalesce(p.role, 'user') <> 'admin'
  order by coalesce(p.gpa, 0) desc, coalesce(p.total_credits, 0) desc, p.created_at asc;
end;
$function$

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_allowed, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), ''),
    'student',
    true,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name),
    is_allowed = COALESCE(public.profiles.is_allowed, true),
    is_approved = COALESCE(public.profiles.is_approved, true);
  RETURN NEW;
END;
$function$

CREATE OR REPLACE FUNCTION public.handle_student_grades_academic_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.recalculate_profile_academic_stats(new.user_id);
  end if;

  if tg_op in ('UPDATE', 'DELETE') and (tg_op = 'DELETE' or old.user_id is distinct from new.user_id) then
    perform public.recalculate_profile_academic_stats(old.user_id);
  end if;

  return coalesce(new, old);
end;
$function$

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id AND role = 'admin' AND is_allowed = true
  );
$function$

CREATE OR REPLACE FUNCTION public.recalculate_all_profiles()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  rec RECORD;
  v_gpa numeric(3,2);
  v_total_credits integer;
  v_course_count integer;
BEGIN
  FOR rec IN SELECT id FROM profiles WHERE role != 'admin' AND username != 'demo' AND full_name != 'demo' LOOP
    
    SELECT 
      COALESCE(
        SUM(
          (COALESCE(hn.katsayi, 0)) * dc.kredi
        ) / NULLIF(SUM(dc.kredi), 0), 0
      )::numeric(3,2),
      COALESCE(SUM(dc.kredi), 0)::integer,
      COUNT(sg.id)::integer
    INTO v_gpa, v_total_credits, v_course_count
    FROM student_grades sg
    JOIN department_courses dc ON sg.department_course_id = dc.id
    LEFT JOIN harf_notlari hn ON sg.harf_notu = hn.harf
    WHERE sg.user_id = rec.id 
      AND sg.harf_notu IS NOT NULL 
      AND sg.harf_notu != 'EK' 
      AND sg.harf_notu != 'DZ';

    UPDATE profiles 
    SET 
      gpa = COALESCE(v_gpa, 0), 
      total_credits = COALESCE(v_total_credits, 0), 
      course_count = COALESCE(v_course_count, 0)
    WHERE id = rec.id;

  END LOOP;
END;
$function$

CREATE OR REPLACE FUNCTION public.recalculate_profile_academic_stats(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  with graded as (
    select
      sg.user_id,
      dc.kredi::numeric as kredi,
      coalesce(nullif(sg.harf_notu, ''), hn.harf, 'FF') as harf,
      coalesce(hn_manual.katsayi, hn.katsayi, 0)::numeric as katsayi
    from student_grades sg
    join department_courses dc on dc.id = sg.department_course_id
    left join lateral (
      select (
        coalesce(sg.vize, 0) * coalesce(dc.vize_yuzde, 0) +
        coalesce(sg.odev, 0) * coalesce(dc.odev_yuzde, 0) +
        coalesce(sg.proje, 0) * coalesce(dc.proje_yuzde, 0) +
        (case when coalesce(sg.bute_kaldi, false) then coalesce(sg.but, 0) else coalesce(sg.final, 0) end) * coalesce(dc.final_yuzde, 0)
      )::numeric as score
    ) score_calc on true
    left join lateral (
      select h.harf, h.katsayi
      from harf_notlari h
      where score_calc.score >= h.min
      order by h.min desc, h.harf
      limit 1
    ) hn on sg.harf_notu is null
    left join harf_notlari hn_manual on hn_manual.harf = sg.harf_notu
    where sg.user_id = p_user_id
      and (
        nullif(sg.harf_notu, '') is not null or
        coalesce(sg.vize, 0) > 0 or coalesce(sg.odev, 0) > 0 or coalesce(sg.proje, 0) > 0 or
        coalesce(sg.final, 0) > 0 or coalesce(sg.but, 0) > 0
      )
  ), gpa_calc as (
    select
      coalesce(round(sum(katsayi * kredi) / nullif(sum(kredi), 0), 2), 0)::numeric as gpa
    from graded
    where harf not in ('EK', '-')
  ), passed_calc as (
    select
      coalesce(sum(kredi) filter (
        where harf not in ('FF', 'DZ', 'EK', '-')
          and not (harf in ('DD', 'DC') and (select gpa from gpa_calc) < 2.0)
      ), 0)::integer as total_credits,
      coalesce(count(*) filter (
        where harf not in ('FF', 'DZ', 'EK', '-')
          and not (harf in ('DD', 'DC') and (select gpa from gpa_calc) < 2.0)
      ), 0)::integer as course_count
    from graded
  )
  update profiles p
  set
    gpa = (select gpa from gpa_calc),
    total_credits = (select total_credits from passed_calc),
    course_count = (select course_count from passed_calc),
    updated_at = now()
  where p.id = p_user_id;
end;
$function$

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$

CREATE OR REPLACE FUNCTION public.select_department(dept_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.departments WHERE id = dept_id) THEN
    RAISE EXCEPTION 'Department not found';
  END IF;

  UPDATE public.profiles
  SET department_id = dept_id
  WHERE id = auth.uid() AND is_allowed = true;
END;
$function$

CREATE OR REPLACE FUNCTION public.sync_email_to_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE profiles SET email = NEW.email WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$

CREATE OR REPLACE FUNCTION public.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$

CREATE OR REPLACE FUNCTION public.update_profile_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id uuid;
  v_gpa numeric(3,2);
  v_total_credits integer;
  v_course_count integer;
BEGIN
  -- Determine which user we need to update
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
  ELSE
    v_user_id := NEW.user_id;
  END IF;

  -- Calculate the exact GPA, credits, and course count for this user
  SELECT 
    COALESCE(
      SUM(
        (COALESCE(hn.katsayi, 0)) * dc.kredi
      ) / NULLIF(SUM(dc.kredi), 0), 0
    )::numeric(3,2),
    COALESCE(SUM(dc.kredi), 0)::integer,
    COUNT(sg.id)::integer
  INTO v_gpa, v_total_credits, v_course_count
  FROM student_grades sg
  JOIN department_courses dc ON sg.department_course_id = dc.id
  LEFT JOIN harf_notlari hn ON sg.harf_notu = hn.harf
  WHERE sg.user_id = v_user_id 
    AND sg.harf_notu IS NOT NULL 
    AND sg.harf_notu != 'EK' 
    AND sg.harf_notu != 'DZ';

  -- Update the profiles table
  UPDATE profiles 
  SET 
    gpa = COALESCE(v_gpa, 0), 
    total_credits = COALESCE(v_total_credits, 0), 
    course_count = COALESCE(v_course_count, 0)
  WHERE id = v_user_id;

  RETURN NULL; -- AFTER trigger
END;
$function$

CREATE OR REPLACE FUNCTION public.update_user_email(target_id uuid, new_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE auth.users
  SET email = new_email,
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('email', new_email),
      updated_at = now()
  WHERE id = target_id;

  UPDATE public.profiles
  SET email = new_email
  WHERE id = target_id;
END;
$function$

alter table only "public"."activity_logs" add constraint "activity_logs_pkey" PRIMARY KEY (id);
alter table only "public"."admin_notes" add constraint "admin_notes_pkey" PRIMARY KEY (id);
alter table only "public"."classes" add constraint "classes_pkey" PRIMARY KEY (id);
alter table only "public"."default_course" add constraint "default_course_pkey" PRIMARY KEY (id);
alter table only "public"."department_courses" add constraint "department_courses_pkey" PRIMARY KEY (id);
alter table only "public"."departments" add constraint "departments_pkey" PRIMARY KEY (id);
alter table only "public"."faculties" add constraint "faculties_pkey" PRIMARY KEY (id);
alter table only "public"."faculty_departments" add constraint "faculty_departments_pkey" PRIMARY KEY (id);
alter table only "public"."gano_renkler" add constraint "gano_renkler_pkey" PRIMARY KEY (id);
alter table only "public"."harf_notlari" add constraint "harf_notlari_pkey" PRIMARY KEY (id);
alter table only "public"."harf_renkler" add constraint "harf_renkler_pkey" PRIMARY KEY (id);
alter table only "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY (id);
alter table only "public"."student_grades" add constraint "student_grades_pkey" PRIMARY KEY (id);
alter table only "public"."universities" add constraint "universities_pkey" PRIMARY KEY (id);
alter table only "public"."user_notifications" add constraint "user_notifications_pkey" PRIMARY KEY (id);
alter table only "public"."default_course" add constraint "default_course_key_key" UNIQUE (key);
alter table only "public"."department_courses" add constraint "department_courses_department_id_legacy_id_key" UNIQUE (department_id, legacy_id);
alter table only "public"."departments" add constraint "departments_slug_key" UNIQUE (slug);
alter table only "public"."faculties" add constraint "faculties_slug_key" UNIQUE (slug);
alter table only "public"."faculty_departments" add constraint "faculty_departments_faculty_id_department_slug_key" UNIQUE (faculty_id, department_slug);
alter table only "public"."harf_renkler" add constraint "harf_renkler_harf_key" UNIQUE (harf);
alter table only "public"."profiles" add constraint "profiles_username_key" UNIQUE (username);
alter table only "public"."student_grades" add constraint "student_grades_user_id_department_course_id_key" UNIQUE (user_id, department_course_id);
alter table only "public"."universities" add constraint "universities_slug_key" UNIQUE (slug);
alter table only "public"."profiles" add constraint "profiles_hedef_gano_check" CHECK (hedef_gano >= 0::numeric AND hedef_gano <= 4.00);
alter table only "public"."activity_logs" add constraint "activity_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table only "public"."admin_notes" add constraint "admin_notes_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table only "public"."admin_notes" add constraint "admin_notes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table only "public"."classes" add constraint "classes_department_id_fkey" FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE;
alter table only "public"."department_courses" add constraint "department_courses_department_id_fkey" FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE;
alter table only "public"."faculties" add constraint "faculties_university_id_fkey" FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE SET NULL;
alter table only "public"."faculty_departments" add constraint "faculty_departments_faculty_id_fkey" FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE;
alter table only "public"."profiles" add constraint "profiles_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;
alter table only "public"."profiles" add constraint "profiles_department_id_fkey" FOREIGN KEY (department_id) REFERENCES departments(id);
alter table only "public"."profiles" add constraint "profiles_faculty_id_fkey" FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE SET NULL;
alter table only "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table only "public"."profiles" add constraint "profiles_university_id_fkey" FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE SET NULL;
alter table only "public"."student_grades" add constraint "student_grades_department_course_id_fkey" FOREIGN KEY (department_course_id) REFERENCES department_courses(id) ON DELETE CASCADE;
alter table only "public"."student_grades" add constraint "student_grades_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table only "public"."user_notifications" add constraint "user_notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_department_courses_department ON public.department_courses USING btree (department_id);
CREATE INDEX IF NOT EXISTS idx_department_courses_department_id ON public.department_courses USING btree (department_id);
CREATE INDEX IF NOT EXISTS idx_department_courses_donem ON public.department_courses USING btree (department_id, donem);
CREATE INDEX IF NOT EXISTS idx_profiles_faculty_id ON public.profiles USING btree (faculty_id);
CREATE INDEX IF NOT EXISTS idx_profiles_university_id ON public.profiles USING btree (university_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_course ON public.student_grades USING btree (department_course_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_user ON public.student_grades USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_grades_user_course ON public.student_grades USING btree (user_id, department_course_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_user_id ON public.student_grades USING btree (user_id);

alter table "public"."activity_logs" enable row level security;
alter table "public"."admin_notes" enable row level security;
alter table "public"."classes" enable row level security;
alter table "public"."default_course" enable row level security;
alter table "public"."department_courses" enable row level security;
alter table "public"."departments" enable row level security;
alter table "public"."faculties" enable row level security;
alter table "public"."faculty_departments" enable row level security;
alter table "public"."gano_renkler" enable row level security;
alter table "public"."harf_notlari" enable row level security;
alter table "public"."harf_renkler" enable row level security;
alter table "public"."profiles" enable row level security;
alter table "public"."student_grades" enable row level security;
alter table "public"."universities" enable row level security;
alter table "public"."user_notifications" enable row level security;

CREATE POLICY "Activity logs insertable by everyone" ON "public"."activity_logs"
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Activity logs viewable by admins" ON "public"."activity_logs"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));

CREATE POLICY "Users can insert their own activity logs" ON "public"."activity_logs"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can view their own activity logs" ON "public"."activity_logs"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = user_id));

CREATE POLICY "Admin notes are fully accessible by admins" ON "public"."admin_notes"
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));

CREATE POLICY "Classes are deletable by admins" ON "public"."classes"
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));

CREATE POLICY "Classes are insertable by admins" ON "public"."classes"
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));

CREATE POLICY "Classes are updatable by admins" ON "public"."classes"
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));

CREATE POLICY "Classes are viewable by everyone" ON "public"."classes"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "default_course_select" ON "public"."default_course"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "dc_all" ON "public"."department_courses"
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true);

CREATE POLICY "dc_delete" ON "public"."department_courses"
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (true);

CREATE POLICY "dc_insert" ON "public"."department_courses"
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "dc_select" ON "public"."department_courses"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "dc_update" ON "public"."department_courses"
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "dcdel" ON "public"."department_courses"
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (((auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.role = 'admin'::text))) OR (department_id = ( SELECT profiles.department_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))));

CREATE POLICY "dcins" ON "public"."department_courses"
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (((auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.role = 'admin'::text))) OR (department_id = ( SELECT profiles.department_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))));

CREATE POLICY "dcsel" ON "public"."department_courses"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "dcupd" ON "public"."department_courses"
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (((auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.role = 'admin'::text))) OR (department_id = ( SELECT profiles.department_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))))
  WITH CHECK (((auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.role = 'admin'::text))) OR (department_id = ( SELECT profiles.department_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))));

CREATE POLICY "department_courses_admin_write" ON "public"."department_courses"
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "department_courses_delete" ON "public"."department_courses"
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (is_admin());

CREATE POLICY "department_courses_insert" ON "public"."department_courses"
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((is_admin() OR (department_id = ( SELECT profiles.department_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))));

CREATE POLICY "department_courses_select" ON "public"."department_courses"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "department_courses_update" ON "public"."department_courses"
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((is_admin() OR (department_id = ( SELECT profiles.department_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))))
  WITH CHECK ((is_admin() OR (department_id = ( SELECT profiles.department_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))));

CREATE POLICY "departments_admin_write" ON "public"."departments"
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "departments_select" ON "public"."departments"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "dsel" ON "public"."departments"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "facultes_select" ON "public"."faculties"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "faculties_select" ON "public"."faculties"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "faculty_departments_select" ON "public"."faculty_departments"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "gano_renkler_select" ON "public"."gano_renkler"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "harf_notlari_select" ON "public"."harf_notlari"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "harf_renkler_select" ON "public"."harf_renkler"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "profiles_admin_delete" ON "public"."profiles"
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (is_admin());

CREATE POLICY "profiles_delete" ON "public"."profiles"
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (true);

CREATE POLICY "profiles_insert" ON "public"."profiles"
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "profiles_select" ON "public"."profiles"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "profiles_select_own_or_admin" ON "public"."profiles"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (((auth.uid() = id) OR is_admin()));

CREATE POLICY "profiles_update" ON "public"."profiles"
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "profiles_update_own_or_admin" ON "public"."profiles"
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (((auth.uid() = id) OR is_admin()))
  WITH CHECK (((auth.uid() = id) OR is_admin()));

CREATE POLICY "psel" ON "public"."profiles"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "pupd" ON "public"."profiles"
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((auth.uid() = id))
  WITH CHECK ((auth.uid() = id));

CREATE POLICY "sg_admin" ON "public"."student_grades"
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text))
  WITH CHECK ((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text));

CREATE POLICY "sg_all" ON "public"."student_grades"
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true);

CREATE POLICY "sg_delete" ON "public"."student_grades"
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (true);

CREATE POLICY "sg_insert" ON "public"."student_grades"
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "sg_read" ON "public"."student_grades"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));

CREATE POLICY "sg_select" ON "public"."student_grades"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "sg_update" ON "public"."student_grades"
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "sg_write" ON "public"."student_grades"
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "student_grades_delete_own_or_admin" ON "public"."student_grades"
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (((auth.uid() = user_id) OR is_admin()));

CREATE POLICY "student_grades_insert_own_or_admin" ON "public"."student_grades"
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (((auth.uid() = user_id) OR is_admin()));

CREATE POLICY "student_grades_select_own_or_admin" ON "public"."student_grades"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (((auth.uid() = user_id) OR is_admin()));

CREATE POLICY "student_grades_update_own_or_admin" ON "public"."student_grades"
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (((auth.uid() = user_id) OR is_admin()))
  WITH CHECK (((auth.uid() = user_id) OR is_admin()));

CREATE POLICY "universities_admin_write" ON "public"."universities"
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "universities_select" ON "public"."universities"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

CREATE TRIGGER department_courses_touch_updated_at BEFORE UPDATE ON department_courses FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER on_profile_delete AFTER DELETE ON profiles FOR EACH ROW EXECUTE FUNCTION delete_auth_user();
CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER student_grades_academic_stats AFTER INSERT OR DELETE OR UPDATE ON student_grades FOR EACH ROW EXECUTE FUNCTION handle_student_grades_academic_stats();
CREATE TRIGGER student_grades_touch_updated_at BEFORE UPDATE ON student_grades FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_update_profile_stats AFTER INSERT OR DELETE OR UPDATE ON student_grades FOR EACH ROW EXECUTE FUNCTION update_profile_stats();

grant usage on schema "public" to "anon", "authenticated", "service_role";
grant all on all tables in schema "public" to "anon", "authenticated", "service_role";
grant all on all sequences in schema "public" to "anon", "authenticated", "service_role";
grant all on all functions in schema "public" to "anon", "authenticated", "service_role";

