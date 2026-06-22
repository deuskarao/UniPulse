-- Production readiness migration for UniPulse.
-- Safe to run more than once in Supabase SQL Editor.
-- Run this ENTIRE script in one go (not piece by piece).

-- Ensure postgres has full access
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Departments
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  ad text NOT NULL,
  ikon text,
  renk varchar(7),
  aciklama text,
  toplam_kredi integer NOT NULL DEFAULT 0,
  toplam_donem integer NOT NULL DEFAULT 8,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  aktif_program_donemi integer NOT NULL DEFAULT 1,
  is_allowed boolean NOT NULL DEFAULT true,
  is_approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aktif_program_donemi integer NOT NULL DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_allowed boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Department courses
CREATE TABLE IF NOT EXISTS public.department_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  legacy_id integer,
  ad text NOT NULL,
  kredi numeric NOT NULL DEFAULT 0,
  ders_saati numeric NOT NULL DEFAULT 0,
  vize_yuzde numeric NOT NULL DEFAULT 0.4,
  odev_yuzde numeric NOT NULL DEFAULT 0,
  final_yuzde numeric NOT NULL DEFAULT 0.6,
  donem integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_department_courses_department_id ON public.department_courses(department_id);
CREATE INDEX IF NOT EXISTS idx_department_courses_donem ON public.department_courses(department_id, donem);

-- Student grades
CREATE TABLE IF NOT EXISTS public.student_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_course_id uuid NOT NULL REFERENCES public.department_courses(id) ON DELETE CASCADE,
  vize numeric NOT NULL DEFAULT 0 CHECK (vize >= 0 AND vize <= 100),
  odev numeric NOT NULL DEFAULT 0 CHECK (odev >= 0 AND odev <= 100),
  final numeric NOT NULL DEFAULT 0 CHECK (final >= 0 AND final <= 100),
  harf_notu text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, department_course_id)
);

ALTER TABLE public.student_grades ADD COLUMN IF NOT EXISTS harf_notu text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_grades_user_course ON public.student_grades(user_id, department_course_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_user_id ON public.student_grades(user_id);

-- Harf notlari
CREATE TABLE IF NOT EXISTS public.harf_notlari (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  harf varchar(2) NOT NULL UNIQUE,
  katsayi numeric(3,1) NOT NULL,
  min integer NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

DELETE FROM public.harf_notlari;
INSERT INTO public.harf_notlari (harf, katsayi, min) VALUES
('AA', 4.0, 90),
('AB', 3.7, 85),
('BA', 3.3, 80),
('BB', 3.0, 75),
('BC', 2.7, 70),
('CB', 2.3, 65),
('CC', 2.0, 60),
('CD', 1.7, 55),
('DC', 1.3, 50),
('DD', 1.0, 45),
('FF', 0.0, 0),
('DZ', 0.0, 0),
('EK', 0.0, 0);

-- Harf renkleri
CREATE TABLE IF NOT EXISTS public.harf_renkler (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  harf varchar(2) NOT NULL UNIQUE REFERENCES public.harf_notlari(harf) ON DELETE CASCADE,
  renk varchar(7) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

DELETE FROM public.harf_renkler;
INSERT INTO public.harf_renkler (harf, renk) VALUES
('AA', '#22c55e'),
('AB', '#4ade80'),
('BA', '#84cc16'),
('BB', '#a3e635'),
('BC', '#bef264'),
('CB', '#facc15'),
('CC', '#fb923c'),
('CD', '#f87171'),
('DC', '#ef4444'),
('DD', '#dc2626'),
('FF', '#991b1b'),
('DZ', '#71717a'),
('EK', '#71717a')
ON CONFLICT (harf) DO UPDATE SET renk = EXCLUDED.renk;

-- GANO renkleri
CREATE TABLE IF NOT EXISTS public.gano_renkler (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_gano numeric(3,2) NOT NULL UNIQUE,
  renk varchar(7) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

DELETE FROM public.gano_renkler;
INSERT INTO public.gano_renkler (min_gano, renk) VALUES
(3.50, '#22c55e'),
(3.00, '#84cc16'),
(2.50, '#facc15'),
(2.00, '#fb923c'),
(0.00, '#ef4444');

-- Default course
CREATE TABLE IF NOT EXISTS public.default_course (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.default_course (key, value) VALUES
('bos_ders', '{"ad":"","kredi":3,"dersSaati":2,"vizeYuzde":0.4,"odevYuzde":0,"finalYuzde":0.6,"vize":0,"odev":0,"final":0,"harfNotu":null,"donem":1}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Faculties
CREATE TABLE IF NOT EXISTS public.faculties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad text NOT NULL,
  emoji text NOT NULL,
  renk varchar(7) NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.faculties (ad, emoji, renk, slug) VALUES
('Açıköğretim Fakültesi', '📖', '#8b5cf6', 'acikogretim-fakultesi'),
('Adalet Meslek Yüksekokulu', '⚖️', '#6366f1', 'adalet-myo'),
('Bilişim Teknolojileri Meslek Yüksekokulu', '💻', '#06b6d4', 'bilisim-teknolojileri-myo'),
('Eczacılık Fakültesi', '💊', '#f43f5e', 'eczacilik-fakultesi'),
('Edebiyat Fakültesi', '📖', '#8b5cf6', 'edebiyat-fakultesi'),
('Eğitim Fakültesi', '🎓', '#10b981', 'egitim-fakultesi'),
('Eskişehir Meslek Yüksekokulu', '🏭', '#78716c', 'eskisehir-myo'),
('Güzel Sanatlar Fakültesi', '🎨', '#ec4899', 'guzel-sanatlar-fakultesi'),
('Hukuk Fakültesi', '⚖️', '#6366f1', 'hukuk-fakultesi'),
('İİBF', '💰', '#f59e0b', 'iibf'),
('İktisat Fakültesi', '📉', '#f97316', 'iktisat-fakultesi'),
('İletişim Bilimleri Fakültesi', '📡', '#ec4899', 'iletisim-bilimleri-fakultesi'),
('Sağlık Bilimleri Fakültesi', '🏥', '#14b8a6', 'saglik-bilimleri-fakultesi'),
('Turizm Fakültesi', '✈️', '#14b8a6', 'turizm-fakultesi'),
('Yunus Emre Sağlık Hizmetleri Meslek Yüksekokulu', '🩺', '#f43f5e', 'yunus-emre-saglik-myo')
ON CONFLICT (slug) DO UPDATE SET ad = EXCLUDED.ad, emoji = EXCLUDED.emoji, renk = EXCLUDED.renk;

-- Faculty-Department mapping
CREATE TABLE IF NOT EXISTS public.faculty_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id uuid NOT NULL REFERENCES public.faculties(id) ON DELETE CASCADE,
  department_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(faculty_id, department_slug)
);

DELETE FROM public.faculty_departments;

INSERT INTO public.faculty_departments (faculty_id, department_slug) VALUES
((SELECT id FROM public.faculties WHERE slug='acikogretim-fakultesi'), 'bilgisayar-programciligi'),
((SELECT id FROM public.faculties WHERE slug='adalet-myo'), 'adalet'),
((SELECT id FROM public.faculties WHERE slug='bilisim-teknolojileri-myo'), 'arka-yuz-yazilim-gelistirme'),
((SELECT id FROM public.faculties WHERE slug='bilisim-teknolojileri-myo'), 'buyuk-veri-analistligi'),
((SELECT id FROM public.faculties WHERE slug='bilisim-teknolojileri-myo'), 'oyun-gelistirme-ve-programlama'),
((SELECT id FROM public.faculties WHERE slug='eczacilik-fakultesi'), 'eczacilik'),
((SELECT id FROM public.faculties WHERE slug='edebiyat-fakultesi'), 'arkeoloji'),
((SELECT id FROM public.faculties WHERE slug='edebiyat-fakultesi'), 'felsefe'),
((SELECT id FROM public.faculties WHERE slug='edebiyat-fakultesi'), 'psikoloji'),
((SELECT id FROM public.faculties WHERE slug='edebiyat-fakultesi'), 'rus-dili-ve-edebiyati'),
((SELECT id FROM public.faculties WHERE slug='edebiyat-fakultesi'), 'sanat-tarihi'),
((SELECT id FROM public.faculties WHERE slug='edebiyat-fakultesi'), 'sosyoloji'),
((SELECT id FROM public.faculties WHERE slug='edebiyat-fakultesi'), 'turk-dili-ve-edebiyati'),
((SELECT id FROM public.faculties WHERE slug='egitim-fakultesi'), 'almanca-ogretmenligi'),
((SELECT id FROM public.faculties WHERE slug='egitim-fakultesi'), 'bilgisayar-ve-ogretim-teknolojileri'),
((SELECT id FROM public.faculties WHERE slug='egitim-fakultesi'), 'fransizca-ogretmenligi'),
((SELECT id FROM public.faculties WHERE slug='egitim-fakultesi'), 'ilkogretim-matematik-ogretmenligi'),
((SELECT id FROM public.faculties WHERE slug='egitim-fakultesi'), 'ingilizce-ogretmenligi'),
((SELECT id FROM public.faculties WHERE slug='egitim-fakultesi'), 'okul-oncesi-ogretmenligi'),
((SELECT id FROM public.faculties WHERE slug='egitim-fakultesi'), 'ozel-egitim-ogretmenligi'),
((SELECT id FROM public.faculties WHERE slug='egitim-fakultesi'), 'rehberlik-ve-psikolojik-danismanlik'),
((SELECT id FROM public.faculties WHERE slug='egitim-fakultesi'), 'sinif-ogretmenligi'),
((SELECT id FROM public.faculties WHERE slug='egitim-fakultesi'), 'sosyal-bilgiler-ogretmenligi'),
((SELECT id FROM public.faculties WHERE slug='eskisehir-myo'), 'ascilik'),
((SELECT id FROM public.faculties WHERE slug='eskisehir-myo'), 'dis-ticaret'),
((SELECT id FROM public.faculties WHERE slug='eskisehir-myo'), 'emlak-yonetimi'),
((SELECT id FROM public.faculties WHERE slug='eskisehir-myo'), 'ofis-yonetimi-ve-sekreterlik'),
((SELECT id FROM public.faculties WHERE slug='eskisehir-myo'), 'pazarlama'),
((SELECT id FROM public.faculties WHERE slug='eskisehir-myo'), 'turizm-ve-otel-isletmeciligi'),
((SELECT id FROM public.faculties WHERE slug='guzel-sanatlar-fakultesi'), 'cizgi-film-ve-animasyon'),
((SELECT id FROM public.faculties WHERE slug='guzel-sanatlar-fakultesi'), 'dijital-oyun-tasarimi'),
((SELECT id FROM public.faculties WHERE slug='guzel-sanatlar-fakultesi'), 'grafik-sanatlar'),
((SELECT id FROM public.faculties WHERE slug='guzel-sanatlar-fakultesi'), 'heykel'),
((SELECT id FROM public.faculties WHERE slug='guzel-sanatlar-fakultesi'), 'resim'),
((SELECT id FROM public.faculties WHERE slug='guzel-sanatlar-fakultesi'), 'seramik'),
((SELECT id FROM public.faculties WHERE slug='hukuk-fakultesi'), 'hukuk'),
((SELECT id FROM public.faculties WHERE slug='iibf'), 'bankacilik-ve-finans'),
((SELECT id FROM public.faculties WHERE slug='iibf'), 'calisma-ekonomisi-ve-endustri-iliskileri'),
((SELECT id FROM public.faculties WHERE slug='iibf'), 'isletme'),
((SELECT id FROM public.faculties WHERE slug='iibf'), 'maliye'),
((SELECT id FROM public.faculties WHERE slug='iibf'), 'muhasebe-ve-finans-yonetimi'),
((SELECT id FROM public.faculties WHERE slug='iibf'), 'pazarlama'),
((SELECT id FROM public.faculties WHERE slug='iibf'), 'siyaset-bilimi-ve-kamu-yonetimi'),
((SELECT id FROM public.faculties WHERE slug='iibf'), 'turizm-ve-otel-isletmeciligi'),
((SELECT id FROM public.faculties WHERE slug='iibf'), 'uluslararasi-iliskiler'),
((SELECT id FROM public.faculties WHERE slug='iktisat-fakultesi'), 'iktisat'),
((SELECT id FROM public.faculties WHERE slug='iletisim-bilimleri-fakultesi'), 'gazetecilik'),
((SELECT id FROM public.faculties WHERE slug='iletisim-bilimleri-fakultesi'), 'gorsel-iletisim-tasarimi'),
((SELECT id FROM public.faculties WHERE slug='iletisim-bilimleri-fakultesi'), 'halkla-iliskiler-ve-tanitim'),
((SELECT id FROM public.faculties WHERE slug='iletisim-bilimleri-fakultesi'), 'iletisim-bilimleri'),
((SELECT id FROM public.faculties WHERE slug='iletisim-bilimleri-fakultesi'), 'radyo-televizyon-ve-sinema'),
((SELECT id FROM public.faculties WHERE slug='iletisim-bilimleri-fakultesi'), 'reklamcilik'),
((SELECT id FROM public.faculties WHERE slug='saglik-bilimleri-fakultesi'), 'beslenme-ve-diyetetik'),
((SELECT id FROM public.faculties WHERE slug='saglik-bilimleri-fakultesi'), 'dil-ve-konusma-terapisi'),
((SELECT id FROM public.faculties WHERE slug='saglik-bilimleri-fakultesi'), 'sosyal-hizmet'),
((SELECT id FROM public.faculties WHERE slug='turizm-fakultesi'), 'gastronomi-ve-mutfak-sanatlari'),
((SELECT id FROM public.faculties WHERE slug='turizm-fakultesi'), 'turizm-rehberligi'),
((SELECT id FROM public.faculties WHERE slug='yunus-emre-saglik-myo'), 'ascilik'),
((SELECT id FROM public.faculties WHERE slug='yunus-emre-saglik-myo'), 'cocuk-gelisimi'),
((SELECT id FROM public.faculties WHERE slug='yunus-emre-saglik-myo'), 'eczane-hizmetleri'),
((SELECT id FROM public.faculties WHERE slug='yunus-emre-saglik-myo'), 'sac-bakimi-ve-guzellik-hizmetleri'),
((SELECT id FROM public.faculties WHERE slug='yunus-emre-saglik-myo'), 'tibbi-laboratuvar-teknikleri')
ON CONFLICT DO NOTHING;

-- is_admin helper
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id AND role = 'admin' AND is_allowed = true
  );
$$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_touch_updated_at ON public.profiles;
CREATE TRIGGER profiles_touch_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS department_courses_touch_updated_at ON public.department_courses;
CREATE TRIGGER department_courses_touch_updated_at
BEFORE UPDATE ON public.department_courses
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS student_grades_touch_updated_at ON public.student_grades;
CREATE TRIGGER student_grades_touch_updated_at
BEFORE UPDATE ON public.student_grades
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- select_department RPC
CREATE OR REPLACE FUNCTION public.select_department(dept_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- update_user_email RPC
CREATE OR REPLACE FUNCTION public.update_user_email(target_id uuid, new_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
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
$$;

-- delete_user RPC
-- NOTE: This function deletes profile + grades only.
-- The actual auth.users deletion must be done via Supabase Dashboard
-- or a service_role key, because auth.users requires superuser.
CREATE OR REPLACE FUNCTION public.delete_user(target_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harf_notlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harf_renkler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gano_renkler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.default_course ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_departments ENABLE ROW LEVEL SECURITY;

-- Departments
DROP POLICY IF EXISTS departments_select ON public.departments;
CREATE POLICY departments_select ON public.departments FOR SELECT USING (true);
DROP POLICY IF EXISTS departments_admin_write ON public.departments;
CREATE POLICY departments_admin_write ON public.departments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Profiles
DROP POLICY IF EXISTS profiles_select_own_or_admin ON public.profiles;
CREATE POLICY profiles_select_own_or_admin ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS profiles_update_own_or_admin ON public.profiles;
CREATE POLICY profiles_update_own_or_admin ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin()) WITH CHECK (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS profiles_admin_delete ON public.profiles;
CREATE POLICY profiles_admin_delete ON public.profiles FOR DELETE USING (public.is_admin());

-- Department courses
DROP POLICY IF EXISTS department_courses_select ON public.department_courses;
CREATE POLICY department_courses_select ON public.department_courses FOR SELECT USING (true);
DROP POLICY IF EXISTS department_courses_admin_write ON public.department_courses;
CREATE POLICY department_courses_admin_write ON public.department_courses FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Student grades
DROP POLICY IF EXISTS student_grades_select_own_or_admin ON public.student_grades;
CREATE POLICY student_grades_select_own_or_admin ON public.student_grades FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS student_grades_insert_own_or_admin ON public.student_grades;
CREATE POLICY student_grades_insert_own_or_admin ON public.student_grades FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS student_grades_update_own_or_admin ON public.student_grades;
CREATE POLICY student_grades_update_own_or_admin ON public.student_grades FOR UPDATE USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS student_grades_delete_own_or_admin ON public.student_grades;
CREATE POLICY student_grades_delete_own_or_admin ON public.student_grades FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Config tables (read for all, admin write)
DROP POLICY IF EXISTS harf_notlari_select ON public.harf_notlari;
CREATE POLICY harf_notlari_select ON public.harf_notlari FOR SELECT USING (true);
DROP POLICY IF EXISTS harf_renkler_select ON public.harf_renkler;
CREATE POLICY harf_renkler_select ON public.harf_renkler FOR SELECT USING (true);
DROP POLICY IF EXISTS gano_renkler_select ON public.gano_renkler;
CREATE POLICY gano_renkler_select ON public.gano_renkler FOR SELECT USING (true);
DROP POLICY IF EXISTS default_course_select ON public.default_course;
CREATE POLICY default_course_select ON public.default_course FOR SELECT USING (true);
DROP POLICY IF EXISTS faculties_select ON public.faculties;
CREATE POLICY faculties_select ON public.faculties FOR SELECT USING (true);
DROP POLICY IF EXISTS faculty_departments_select ON public.faculty_departments;
CREATE POLICY faculty_departments_select ON public.faculty_departments FOR SELECT USING (true);

DROP POLICY IF EXISTS harf_notlari_admin_write ON public.harf_notlari;
CREATE POLICY harf_notlari_admin_write ON public.harf_notlari FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS harf_renkler_admin_write ON public.harf_renkler;
CREATE POLICY harf_renkler_admin_write ON public.harf_renkler FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS gano_renkler_admin_write ON public.gano_renkler;
CREATE POLICY gano_renkler_admin_write ON public.gano_renkler FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS default_course_admin_write ON public.default_course;
CREATE POLICY default_course_admin_write ON public.default_course FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS faculties_admin_write ON public.faculties;
CREATE POLICY faculties_admin_write ON public.faculties FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS faculty_departments_admin_write ON public.faculty_departments;
CREATE POLICY faculty_departments_admin_write ON public.faculty_departments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
