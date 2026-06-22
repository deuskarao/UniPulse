-- `department_courses` tablosuna `proje_yuzde` eklenecek
ALTER TABLE public.department_courses ADD COLUMN IF NOT EXISTS proje_yuzde numeric DEFAULT 0;

-- `student_grades` tablosuna `proje` notu eklenecek
ALTER TABLE public.student_grades ADD COLUMN IF NOT EXISTS proje numeric;
