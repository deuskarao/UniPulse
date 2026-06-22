-- profiles tablosuna university_id ve faculty_id ekle
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS university_id uuid REFERENCES public.universities(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS faculty_id uuid REFERENCES public.faculties(id) ON DELETE SET NULL;

-- Önce faculties tablosundaki null university_id'leri Anadolu Üniversitesi'ne bağla
UPDATE public.faculties
SET university_id = (SELECT id FROM public.universities WHERE slug = 'anadolu-universitesi')
WHERE university_id IS NULL;

-- Sonra profiles'i güncelle
UPDATE public.profiles p
SET 
  university_id = f.university_id,
  faculty_id = f.id
FROM public.departments d
JOIN public.faculty_departments fd ON fd.department_slug = d.slug
JOIN public.faculties f ON fd.faculty_id = f.id
WHERE p.department_id = d.id
  AND f.university_id IS NOT NULL;

-- Indexler
CREATE INDEX IF NOT EXISTS idx_profiles_university_id ON public.profiles(university_id);
CREATE INDEX IF NOT EXISTS idx_profiles_faculty_id ON public.profiles(faculty_id);