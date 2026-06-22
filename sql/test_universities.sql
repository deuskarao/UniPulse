-- 10 test üniversite ekle + universities tablosu oluştur
-- Supabase SQL Editor'da çalıştır

-- Üniversiteler tablosu
CREATE TABLE IF NOT EXISTS public.universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad text NOT NULL,
  emoji text NOT NULL DEFAULT '🏛️',
  renk varchar(7) NOT NULL DEFAULT '#6366f1',
  slug text NOT NULL UNIQUE,
  aciklama text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Fakültelere üniversite bağlama
ALTER TABLE public.faculties ADD COLUMN IF NOT EXISTS university_id uuid REFERENCES public.universities(id) ON DELETE SET NULL;

-- 10 test üniversite
INSERT INTO public.universities (ad, emoji, renk, slug, aciklama) VALUES
('Anadolu Üniversitesi', '🏛️', '#6366f1', 'anadolu-universitesi', 'Eskişehir, Türkiye — 1958''den beri açık ve uzaktan eğitim'),
('İstanbul Üniversitesi', '🦁', '#dc2626', 'istanbul-universitesi', 'İstanbul, Türkiye — 1453''te kurulan ilk Osmanlı üniversitesi'),
('Ankara Üniversitesi', '🦊', '#2563eb', 'ankara-universitesi', 'Ankara, Türkiye — 1946''da kurulan köklü devlet üniversitesi'),
('Boğaziçi Üniversitesi', '🌊', '#0891b2', 'bogazici-universitesi', 'İstanbul, Türkiye — 1863''te Robert Kolej olarak kuruldu'),
('ODTÜ', '⚙️', '#16a34a', 'odtu', 'Ankara, Türkiye — 1956''da teknoloji odaklı kuruldu'),
('Bilkent Üniversitesi', '🌟', '#9333ea', 'bilkent-universitesi', 'Ankara, Türkiye — 1984''te Türkiye''nin ilk özel üniversitesi'),
('Koç Üniversitesi', '🔴', '#b91c1c', 'koc-universitesi', 'İstanbul, Türkiye — 1993''te Vehbi Koç Vakfı tarafından kuruldu'),
('Sabancı Üniversitesi', '🟠', '#ea580c', 'sabanci-universitesi', 'İstanbul, Türkiye — 1994''te Sabancı Vakfı tarafından kuruldu'),
('Hacettepe Üniversitesi', '🐝', '#ca8a04', 'hacettepe-universitesi', 'Ankara, Türkiye — 1967''de tıp merkezi olarak kuruldu'),
('Ege Üniversitesi', '☀️', '#f59e0b', 'ege-universitesi', 'İzmir, Türkiye — 1955''te kurulan köklü Aegean üniversitesi')
ON CONFLICT (slug) DO UPDATE SET ad = EXCLUDED.ad, emoji = EXCLUDED.emoji, renk = EXCLUDED.renk, aciklama = EXCLUDED.aciklama;

-- Tüm mevcut fakülteleri Anadolu Üniversitesi'ne bağla
UPDATE public.faculties
SET university_id = (SELECT id FROM public.universities WHERE slug = 'anadolu-universitesi')
WHERE university_id IS NULL;

-- RLS
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS universities_select ON public.universities;
CREATE POLICY universities_select ON public.universities FOR SELECT USING (true);
DROP POLICY IF EXISTS universities_admin_write ON public.universities;
CREATE POLICY universities_admin_write ON public.universities FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
