-- ============================================================
-- UniPulse Migration v2: Yeni Üniversiteler + Eksik Müfredatlar
-- ============================================================
-- Bu migration:
--   1. legacy_id=0 olan kayıtları NULL yapar (constraint fix)
--   2. 20 yeni üniversite ekler (İTÜ, Marmara, Yıldız, vb.)
--   3. Her yeni üniversiteye fakülteler ekler
--   4. Fakülteleri mevcut bölümlerle eşleştirir
--   5. 56 bölümün müfredatlarını ekler (idempotent)
--      Sadece dersleri olmayan bölümlere ekleme yapar
--
-- KORUNAN BÖLÜMLER (dokunulmaz):
--   * Dış Ticaret (Anadolu Üniversitesi)
--   * Bilgisayar Programcılığı (Anadolu Üniversitesi)
--   * Özel Eğitim Öğretmenliği (Anadolu Üniversitesi)
--
-- Bu migration TEKRAR ÇALIŞTIRILABILIR (idempotent).
-- Tarih: 2026-06-28
-- ============================================================

BEGIN;

-- ============================================================
-- 1) legacy_id=0 olan kayıtları NULL yap
-- ============================================================
-- (department_id, legacy_id) unique constraint için.
-- NULL değerler unique sayılmaz, yani çakışma olmaz.
UPDATE department_courses SET legacy_id = NULL WHERE legacy_id = 0;

-- ============================================================
-- 2) 20 Yeni Üniversite Ekle
-- ============================================================
-- slug unique olduğu için ON CONFLICT (slug) DO NOTHING ile idempotent.
-- Mevcut 10 üniversite zaten DB'de var, tekrar eklenmeyecek.

INSERT INTO universities (ad, emoji, renk, slug)
VALUES
  ('İstanbul Teknik Üniversitesi (İTÜ)', '⚙️', '#0d9488', 'itu'),  -- İstanbul Teknik Üniversitesi (İTÜ)
  ('Marmara Üniversitesi', '🏛️', '#7c3aed', 'marmara-universitesi'),  -- Marmara Üniversitesi
  ('Yıldız Teknik Üniversitesi', '🔧', '#0891b2', 'yildiz-teknik-universitesi'),  -- Yıldız Teknik Üniversitesi
  ('Dokuz Eylül Üniversitesi', '🌊', '#0ea5e9', 'dokuz-eylul-universitesi'),  -- Dokuz Eylül Üniversitesi
  ('Gazi Üniversitesi', '🎯', '#dc2626', 'gazi-universitesi'),  -- Gazi Üniversitesi
  ('Gebze Teknik Üniversitesi', '🔬', '#16a34a', 'gebze-teknik-universitesi'),  -- Gebze Teknik Üniversitesi
  ('Eskişehir Teknik Üniversitesi', '✈️', '#4f46e5', 'eskisehir-teknik-universitesi'),  -- Eskişehir Teknik Üniversitesi
  ('Galatasaray Üniversitesi', '🔴', '#b91c1c', 'galatasaray-universitesi'),  -- Galatasaray Üniversitesi
  ('İzmir Yüksek Teknoloji Enstitüsü (İYTE)', '🌊', '#0284c7', 'iyte'),  -- İzmir Yüksek Teknoloji Enstitüsü (İYTE)
  ('Akdeniz Üniversitesi', '🌴', '#16a34a', 'akdeniz-universitesi'),  -- Akdeniz Üniversitesi
  ('Bursa Uludağ Üniversitesi', '⛰️', '#0891b2', 'bursa-uludag-universitesi'),  -- Bursa Uludağ Üniversitesi
  ('Sakarya Üniversitesi', '🍃', '#65a30d', 'sakarya-universitesi'),  -- Sakarya Üniversitesi
  ('Karadeniz Teknik Üniversitesi', '🌲', '#166534', 'karadeniz-teknik-universitesi'),  -- Karadeniz Teknik Üniversitesi
  ('Çukurova Üniversitesi', '🌾', '#ca8a04', 'cukurova-universitesi'),  -- Çukurova Üniversitesi
  ('Erciyes Üniversitesi', '🏔️', '#7c3aed', 'erciyes-universitesi'),  -- Erciyes Üniversitesi
  ('Atatürk Üniversitesi', '🏛️', '#dc2626', 'ataturk-universitesi'),  -- Atatürk Üniversitesi
  ('Pamukkale Üniversitesi', '🏺', '#0891b2', 'pamukkale-universitesi'),  -- Pamukkale Üniversitesi
  ('Kocaeli Üniversitesi', '⚓', '#0d9488', 'kocaeli-universitesi'),  -- Kocaeli Üniversitesi
  ('Selçuk Üniversitesi', '🕌', '#4f46e5', 'selcuk-universitesi'),  -- Selçuk Üniversitesi
  ('Gaziantep Üniversitesi', '🏗️', '#d97706', 'gaziantep-universitesi');  -- Gaziantep Üniversitesi
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3) Yeni Üniversitelere Fakülteler Ekle
-- ============================================================
-- Her fakültenin slug'ı: <fakulte-tipi>-<uni-slug>
-- Örn: 'muhendislik-itu', 'iibf-marmara-universitesi'

-- === İstanbul Teknik Üniversitesi (İTÜ) ===
INSERT INTO faculties (ad, emoji, renk, slug, university_id)
SELECT v.ad, v.emoji, v.renk, v.slug, u.id
FROM universities u
CROSS JOIN (VALUES
  ('Mühendislik Fakültesi', '⚙️', '#4f46e5', 'muhendislik-itu'),
  ('Fen-Edebiyat Fakültesi', '🔬', '#7c3aed', 'fen-edebiyat-itu'),
  ('İktisadi ve İdari Bilimler Fakültesi', '💼', '#0d9488', 'iibf-itu'),
  ('Mimarlık Fakültesi', '🏗️', '#d97706', 'mimarlik-itu'),
  ('Meslek Yüksekokulu', '🔧', '#64748b', 'meslek-yuksekokulu-itu')
) AS v(ad, emoji, renk, slug)
WHERE u.slug = 'itu'
ON CONFLICT (slug) DO NOTHING;

-- === Marmara Üniversitesi ===
INSERT INTO faculties (ad, emoji, renk, slug, university_id)
SELECT v.ad, v.emoji, v.renk, v.slug, u.id
FROM universities u
CROSS JOIN (VALUES
  ('İktisadi ve İdari Bilimler Fakültesi', '💼', '#0d9488', 'iibf-marmara-universitesi'),
  ('Hukuk Fakültesi', '⚖️', '#0891b2', 'hukuk-marmara-universitesi'),
  ('Eğitim Fakültesi', '🎓', '#16a34a', 'egitim-marmara-universitesi'),
  ('İletişim Fakültesi', '📡', '#d97706', 'iletisim-marmara-universitesi'),
  ('Güzel Sanatlar Fakültesi', '🎨', '#dc2626', 'guzel-sanatlar-marmara-universitesi'),
  ('Tıp Fakültesi', '⚕️', '#dc2626', 'tip-marmara-universitesi'),
  ('Meslek Yüksekokulu', '🔧', '#64748b', 'meslek-yuksekokulu-marmara-universitesi')
) AS v(ad, emoji, renk, slug)
WHERE u.slug = 'marmara-universitesi'
ON CONFLICT (slug) DO NOTHING;

-- === Yıldız Teknik Üniversitesi ===
INSERT INTO faculties (ad, emoji, renk, slug, university_id)
SELECT v.ad, v.emoji, v.renk, v.slug, u.id
FROM universities u
CROSS JOIN (VALUES
  ('Mühendislik Fakültesi', '⚙️', '#4f46e5', 'muhendislik-yildiz-teknik-universitesi'),
  ('Fen-Edebiyat Fakültesi', '🔬', '#7c3aed', 'fen-edebiyat-yildiz-teknik-universitesi'),
  ('İktisadi ve İdari Bilimler Fakültesi', '💼', '#0d9488', 'iibf-yildiz-teknik-universitesi'),
  ('Mimarlık Fakültesi', '🏗️', '#d97706', 'mimarlik-yildiz-teknik-universitesi'),
  ('Meslek Yüksekokulu', '🔧', '#64748b', 'meslek-yuksekokulu-yildiz-teknik-universitesi')
) AS v(ad, emoji, renk, slug)
WHERE u.slug = 'yildiz-teknik-universitesi'
ON CONFLICT (slug) DO NOTHING;

-- === Dokuz Eylül Üniversitesi ===
INSERT INTO faculties (ad, emoji, renk, slug, university_id)
SELECT v.ad, v.emoji, v.renk, v.slug, u.id
FROM universities u
CROSS JOIN (VALUES
  ('Mühendislik Fakültesi', '⚙️', '#4f46e5', 'muhendislik-dokuz-eylul-universitesi'),
  ('Fen-Edebiyat Fakültesi', '🔬', '#7c3aed', 'fen-edebiyat-dokuz-eylul-universitesi'),
  ('İktisadi ve İdari Bilimler Fakültesi', '💼', '#0d9488', 'iibf-dokuz-eylul-universitesi'),
  ('Hukuk Fakültesi', '⚖️', '#0891b2', 'hukuk-dokuz-eylul-universitesi'),
  ('Eczacılık Fakültesi', '💊', '#16a34a', 'eczacilik-dokuz-eylul-universitesi'),
  ('Tıp Fakültesi', '⚕️', '#dc2626', 'tip-dokuz-eylul-universitesi'),
  ('İletişim Fakültesi', '📡', '#d97706', 'iletisim-dokuz-eylul-universitesi'),
  ('Turizm Fakültesi', '🏖️', '#0ea5e9', 'turizm-dokuz-eylul-universitesi'),
  ('Meslek Yüksekokulu', '🔧', '#64748b', 'meslek-yuksekokulu-dokuz-eylul-universitesi')
) AS v(ad, emoji, renk, slug)
WHERE u.slug = 'dokuz-eylul-universitesi'
ON CONFLICT (slug) DO NOTHING;

-- === Gazi Üniversitesi ===
INSERT INTO faculties (ad, emoji, renk, slug, university_id)
SELECT v.ad, v.emoji, v.renk, v.slug, u.id
FROM universities u
CROSS JOIN (VALUES
  ('Mühendislik Fakültesi', '⚙️', '#4f46e5', 'muhendislik-gazi-universitesi'),
  ('Fen-Edebiyat Fakültesi', '🔬', '#7c3aed', 'fen-edebiyat-gazi-universitesi'),
  ('İktisadi ve İdari Bilimler Fakültesi', '💼', '#0d9488', 'iibf-gazi-universitesi'),
  ('Hukuk Fakültesi', '⚖️', '#0891b2', 'hukuk-gazi-universitesi'),
  ('Eğitim Fakültesi', '🎓', '#16a34a', 'egitim-gazi-universitesi'),
  ('İletişim Fakültesi', '📡', '#d97706', 'iletisim-gazi-universitesi'),
  ('Tıp Fakültesi', '⚕️', '#dc2626', 'tip-gazi-universitesi'),
  ('Meslek Yüksekokulu', '🔧', '#64748b', 'meslek-yuksekokulu-gazi-universitesi')
) AS v(ad, emoji, renk, slug)
WHERE u.slug = 'gazi-universitesi'
ON CONFLICT (slug) DO NOTHING;

-- === Gebze Teknik Üniversitesi ===
INSERT INTO faculties (ad, emoji, renk, slug, university_id)
SELECT v.ad, v.emoji, v.renk, v.slug, u.id
FROM universities u
CROSS JOIN (VALUES
  ('Mühendislik Fakültesi', '⚙️', '#4f46e5', 'muhendislik-gebze-teknik-universitesi'),
  ('Fen-Edebiyat Fakültesi', '🔬', '#7c3aed', 'fen-edebiyat-gebze-teknik-universitesi'),
  ('İktisadi ve İdari Bilimler Fakültesi', '💼', '#0d9488', 'iibf-gebze-teknik-universitesi'),
  ('Mimarlık Fakültesi', '🏗️', '#d97706', 'mimarlik-gebze-teknik-universitesi')
) AS v(ad, emoji, renk, slug)
WHERE u.slug = 'gebze-teknik-universitesi'
ON CONFLICT (slug) DO NOTHING;

-- === Eskişehir Teknik Üniversitesi ===
INSERT INTO faculties (ad, emoji, renk, slug, university_id)
SELECT v.ad, v.emoji, v.renk, v.slug, u.id
FROM universities u
CROSS JOIN (VALUES
  ('Mühendislik Fakültesi', '⚙️', '#4f46e5', 'muhendislik-eskisehir-teknik-universitesi'),
  ('Fen-Edebiyat Fakültesi', '🔬', '#7c3aed', 'fen-edebiyat-eskisehir-teknik-universitesi'),
  ('İktisadi ve İdari Bilimler Fakültesi', '💼', '#0d9488', 'iibf-eskisehir-teknik-universitesi'),
  ('Mimarlık Fakültesi', '🏗️', '#d97706', 'mimarlik-eskisehir-teknik-universitesi'),
  ('Turizm Fakültesi', '🏖️', '#0ea5e9', 'turizm-eskisehir-teknik-universitesi'),
  ('Meslek Yüksekokulu', '🔧', '#64748b', 'meslek-yuksekokulu-eskisehir-teknik-universitesi')
) AS v(ad, emoji, renk, slug)
WHERE u.slug = 'eskisehir-teknik-universitesi'
ON CONFLICT (slug) DO NOTHING;

-- === Galatasaray Üniversitesi ===
INSERT INTO faculties (ad, emoji, renk, slug, university_id)
SELECT v.ad, v.emoji, v.renk, v.slug, u.id
FROM universities u
CROSS JOIN (VALUES
  ('İktisadi ve İdari Bilimler Fakültesi', '💼', '#0d9488', 'iibf-galatasaray-universitesi'),
  ('Hukuk Fakültesi', '⚖️', '#0891b2', 'hukuk-galatasaray-universitesi'),
  ('Fen-Edebiyat Fakültesi', '🔬', '#7c3aed', 'fen-edebiyat-galatasaray-universitesi'),
  ('İletişim Fakültesi', '📡', '#d97706', 'iletisim-galatasaray-universitesi')
) AS v(ad, emoji, renk, slug)
WHERE u.slug = 'galatasaray-universitesi'
ON CONFLICT (slug) DO NOTHING;

-- === İzmir Yüksek Teknoloji Enstitüsü (İYTE) ===
INSERT INTO faculties (ad, emoji, renk, slug, university_id)
SELECT v.ad, v.emoji, v.renk, v.slug, u.id
FROM universities u
CROSS JOIN (VALUES
  ('Mühendislik Fakültesi', '⚙️', '#4f46e5', 'muhendislik-iyte'),
  ('Fen-Edebiyat Fakültesi', '🔬', '#7c3aed', 'fen-edebiyat-iyte'),
  ('İktisadi ve İdari Bilimler Fakültesi', '💼', '#0d9488', 'iibf-iyte'),
  ('Mimarlık Fakültesi', '🏗️', '#d97706', 'mimarlik-iyte')
) AS v(ad, emoji, renk, slug)
WHERE u.slug = 'iyte'
ON CONFLICT (slug) DO NOTHING;

-- === Akdeniz Üniversitesi ===
INSERT INTO faculties (ad, emoji, renk, slug, university_id)
SELECT v.ad, v.emoji, v.renk, v.slug, u.id
FROM universities u
CROSS JOIN (VALUES
  ('İktisadi ve İdari Bilimler Fakültesi', '💼', '#0d9488', 'iibf-akdeniz-universitesi'),
  ('Hukuk Fakültesi', '⚖️', '#0891b2', 'hukuk-akdeniz-universitesi'),
  ('Eğitim Fakültesi', '🎓', '#16a34a', 'egitim-akdeniz-universitesi'),
  ('Tıp Fakültesi', '⚕️', '#dc2626', 'tip-akdeniz-universitesi'),
  ('Eczacılık Fakültesi', '💊', '#16a34a', 'eczacilik-akdeniz-universitesi'),
  ('Turizm Fakültesi', '🏖️', '#0ea5e9', 'turizm-akdeniz-universitesi'),
  ('İletişim Fakültesi', '📡', '#d97706', 'iletisim-akdeniz-universitesi'),
  ('Meslek Yüksekokulu', '🔧', '#64748b', 'meslek-yuksekokulu-akdeniz-universitesi')
) AS v(ad, emoji, renk, slug)
WHERE u.slug = 'akdeniz-universitesi'
ON CONFLICT (slug) DO NOTHING;

-- === Bursa Uludağ Üniversitesi ===
INSERT INTO faculties (ad, emoji, renk, slug, university_id)
SELECT v.ad, v.emoji, v.renk, v.slug, u.id
FROM universities u
CROSS JOIN (VALUES
  ('Mühendislik Fakültesi', '⚙️', '#4f46e5', 'muhendislik-bursa-uludag-universitesi'),
  ('Fen-Edebiyat Fakültesi', '🔬', '#7c3aed', 'fen-edebiyat-bursa-uludag-universitesi'),
  ('İktisadi ve İdari Bilimler Fakültesi', '💼', '#0d9488', 'iibf-bursa-uludag-universitesi'),
  ('Hukuk Fakültesi', '⚖️', '#0891b2', 'hukuk-bursa-uludag-universitesi'),
  ('Eğitim Fakültesi', '🎓', '#16a34a', 'egitim-bursa-uludag-universitesi'),
  ('Tıp Fakültesi', '⚕️', '#dc2626', 'tip-bursa-uludag-universitesi'),
  ('Eczacılık Fakültesi', '💊', '#16a34a', 'eczacilik-bursa-uludag-universitesi'),
  ('Turizm Fakültesi', '🏖️', '#0ea5e9', 'turizm-bursa-uludag-universitesi'),
  ('Meslek Yüksekokulu', '🔧', '#64748b', 'meslek-yuksekokulu-bursa-uludag-universitesi')
) AS v(ad, emoji, renk, slug)
WHERE u.slug = 'bursa-uludag-universitesi'
ON CONFLICT (slug) DO NOTHING;

-- === Sakarya Üniversitesi ===
INSERT INTO faculties (ad, emoji, renk, slug, university_id)
SELECT v.ad, v.emoji, v.renk, v.slug, u.id
FROM universities u
CROSS JOIN (VALUES
  ('Mühendislik Fakültesi', '⚙️', '#4f46e5', 'muhendislik-sakarya-universitesi'),
  ('Fen-Edebiyat Fakültesi', '🔬', '#7c3aed', 'fen-edebiyat-sakarya-universitesi'),
  ('İktisadi ve İdari Bilimler Fakültesi', '💼', '#0d9488', 'iibf-sakarya-universitesi'),
  ('Eğitim Fakültesi', '🎓', '#16a34a', 'egitim-sakarya-universitesi'),
  ('İletişim Fakültesi', '📡', '#d97706', 'iletisim-sakarya-universitesi'),
  ('Meslek Yüksekokulu', '🔧', '#64748b', 'meslek-yuksekokulu-sakarya-universitesi')
) AS v(ad, emoji, renk, slug)
WHERE u.slug = 'sakarya-universitesi'
ON CONFLICT (slug) DO NOTHING;

-- === Karadeniz Teknik Üniversitesi ===
INSERT INTO faculties (ad, emoji, renk, slug, university_id)
SELECT v.ad, v.emoji, v.renk, v.slug, u.id
FROM universities u
CROSS JOIN (VALUES
  ('Mühendislik Fakültesi', '⚙️', '#4f46e5', 'muhendislik-karadeniz-teknik-universitesi'),
  ('Fen-Edebiyat Fakültesi', '🔬', '#7c3aed', 'fen-edebiyat-karadeniz-teknik-universitesi'),
  ('İktisadi ve İdari Bilimler Fakültesi', '💼', '#0d9488', 'iibf-karadeniz-teknik-universitesi'),
  ('Hukuk Fakültesi', '⚖️', '#0891b2', 'hukuk-karadeniz-teknik-universitesi'),
  ('Eğitim Fakültesi', '🎓', '#16a34a', 'egitim-karadeniz-teknik-universitesi'),
  ('Tıp Fakültesi', '⚕️', '#dc2626', 'tip-karadeniz-teknik-universitesi'),
  ('Eczacılık Fakültesi', '💊', '#16a34a', 'eczacilik-karadeniz-teknik-universitesi'),
  ('Meslek Yüksekokulu', '🔧', '#64748b', 'meslek-yuksekokulu-karadeniz-teknik-universitesi')
) AS v(ad, emoji, renk, slug)
WHERE u.slug = 'karadeniz-teknik-universitesi'
ON CONFLICT (slug) DO NOTHING;

-- === Çukurova Üniversitesi ===
INSERT INTO faculties (ad, emoji, renk, slug, university_id)
SELECT v.ad, v.emoji, v.renk, v.slug, u.id
FROM universities u
CROSS JOIN (VALUES
  ('Mühendislik Fakültesi', '⚙️', '#4f46e5', 'muhendislik-cukurova-universitesi'),
  ('Fen-Edebiyat Fakültesi', '🔬', '#7c3aed', 'fen-edebiyat-cukurova-universitesi'),
  ('İktisadi ve İdari Bilimler Fakültesi', '💼', '#0d9488', 'iibf-cukurova-universitesi'),
  ('Hukuk Fakültesi', '⚖️', '#0891b2', 'hukuk-cukurova-universitesi'),
  ('Eğitim Fakültesi', '🎓', '#16a34a', 'egitim-cukurova-universitesi'),
  ('Tıp Fakültesi', '⚕️', '#dc2626', 'tip-cukurova-universitesi'),
  ('Eczacılık Fakültesi', '💊', '#16a34a', 'eczacilik-cukurova-universitesi'),
  ('Turizm Fakültesi', '🏖️', '#0ea5e9', 'turizm-cukurova-universitesi'),
  ('Meslek Yüksekokulu', '🔧', '#64748b', 'meslek-yuksekokulu-cukurova-universitesi')
) AS v(ad, emoji, renk, slug)
WHERE u.slug = 'cukurova-universitesi'
ON CONFLICT (slug) DO NOTHING;

-- === Erciyes Üniversitesi ===
INSERT INTO faculties (ad, emoji, renk, slug, university_id)
SELECT v.ad, v.emoji, v.renk, v.slug, u.id
FROM universities u
CROSS JOIN (VALUES
  ('Mühendislik Fakültesi', '⚙️', '#4f46e5', 'muhendislik-erciyes-universitesi'),
  ('Fen-Edebiyat Fakültesi', '🔬', '#7c3aed', 'fen-edebiyat-erciyes-universitesi'),
  ('İktisadi ve İdari Bilimler Fakültesi', '💼', '#0d9488', 'iibf-erciyes-universitesi'),
  ('Hukuk Fakültesi', '⚖️', '#0891b2', 'hukuk-erciyes-universitesi'),
  ('Eğitim Fakültesi', '🎓', '#16a34a', 'egitim-erciyes-universitesi'),
  ('Tıp Fakültesi', '⚕️', '#dc2626', 'tip-erciyes-universitesi'),
  ('Eczacılık Fakültesi', '💊', '#16a34a', 'eczacilik-erciyes-universitesi'),
  ('Meslek Yüksekokulu', '🔧', '#64748b', 'meslek-yuksekokulu-erciyes-universitesi')
) AS v(ad, emoji, renk, slug)
WHERE u.slug = 'erciyes-universitesi'
ON CONFLICT (slug) DO NOTHING;

-- === Atatürk Üniversitesi ===
INSERT INTO faculties (ad, emoji, renk, slug, university_id)
SELECT v.ad, v.emoji, v.renk, v.slug, u.id
FROM universities u
CROSS JOIN (VALUES
  ('Mühendislik Fakültesi', '⚙️', '#4f46e5', 'muhendislik-ataturk-universitesi'),
  ('Fen-Edebiyat Fakültesi', '🔬', '#7c3aed', 'fen-edebiyat-ataturk-universitesi'),
  ('İktisadi ve İdari Bilimler Fakültesi', '💼', '#0d9488', 'iibf-ataturk-universitesi'),
  ('Hukuk Fakültesi', '⚖️', '#0891b2', 'hukuk-ataturk-universitesi'),
  ('Eğitim Fakültesi', '🎓', '#16a34a', 'egitim-ataturk-universitesi'),
  ('Tıp Fakültesi', '⚕️', '#dc2626', 'tip-ataturk-universitesi'),
  ('Eczacılık Fakültesi', '💊', '#16a34a', 'eczacilik-ataturk-universitesi'),
  ('İletişim Fakültesi', '📡', '#d97706', 'iletisim-ataturk-universitesi'),
  ('Meslek Yüksekokulu', '🔧', '#64748b', 'meslek-yuksekokulu-ataturk-universitesi')
) AS v(ad, emoji, renk, slug)
WHERE u.slug = 'ataturk-universitesi'
ON CONFLICT (slug) DO NOTHING;

-- === Pamukkale Üniversitesi ===
INSERT INTO faculties (ad, emoji, renk, slug, university_id)
SELECT v.ad, v.emoji, v.renk, v.slug, u.id
FROM universities u
CROSS JOIN (VALUES
  ('Mühendislik Fakültesi', '⚙️', '#4f46e5', 'muhendislik-pamukkale-universitesi'),
  ('Fen-Edebiyat Fakültesi', '🔬', '#7c3aed', 'fen-edebiyat-pamukkale-universitesi'),
  ('İktisadi ve İdari Bilimler Fakültesi', '💼', '#0d9488', 'iibf-pamukkale-universitesi'),
  ('Eğitim Fakültesi', '🎓', '#16a34a', 'egitim-pamukkale-universitesi'),
  ('Tıp Fakültesi', '⚕️', '#dc2626', 'tip-pamukkale-universitesi'),
  ('Turizm Fakültesi', '🏖️', '#0ea5e9', 'turizm-pamukkale-universitesi'),
  ('Meslek Yüksekokulu', '🔧', '#64748b', 'meslek-yuksekokulu-pamukkale-universitesi')
) AS v(ad, emoji, renk, slug)
WHERE u.slug = 'pamukkale-universitesi'
ON CONFLICT (slug) DO NOTHING;

-- === Kocaeli Üniversitesi ===
INSERT INTO faculties (ad, emoji, renk, slug, university_id)
SELECT v.ad, v.emoji, v.renk, v.slug, u.id
FROM universities u
CROSS JOIN (VALUES
  ('Mühendislik Fakültesi', '⚙️', '#4f46e5', 'muhendislik-kocaeli-universitesi'),
  ('Fen-Edebiyat Fakültesi', '🔬', '#7c3aed', 'fen-edebiyat-kocaeli-universitesi'),
  ('İktisadi ve İdari Bilimler Fakültesi', '💼', '#0d9488', 'iibf-kocaeli-universitesi'),
  ('Hukuk Fakültesi', '⚖️', '#0891b2', 'hukuk-kocaeli-universitesi'),
  ('Eğitim Fakültesi', '🎓', '#16a34a', 'egitim-kocaeli-universitesi'),
  ('Tıp Fakültesi', '⚕️', '#dc2626', 'tip-kocaeli-universitesi'),
  ('İletişim Fakültesi', '📡', '#d97706', 'iletisim-kocaeli-universitesi'),
  ('Meslek Yüksekokulu', '🔧', '#64748b', 'meslek-yuksekokulu-kocaeli-universitesi')
) AS v(ad, emoji, renk, slug)
WHERE u.slug = 'kocaeli-universitesi'
ON CONFLICT (slug) DO NOTHING;

-- === Selçuk Üniversitesi ===
INSERT INTO faculties (ad, emoji, renk, slug, university_id)
SELECT v.ad, v.emoji, v.renk, v.slug, u.id
FROM universities u
CROSS JOIN (VALUES
  ('Mühendislik Fakültesi', '⚙️', '#4f46e5', 'muhendislik-selcuk-universitesi'),
  ('Fen-Edebiyat Fakültesi', '🔬', '#7c3aed', 'fen-edebiyat-selcuk-universitesi'),
  ('İktisadi ve İdari Bilimler Fakültesi', '💼', '#0d9488', 'iibf-selcuk-universitesi'),
  ('Hukuk Fakültesi', '⚖️', '#0891b2', 'hukuk-selcuk-universitesi'),
  ('Eğitim Fakültesi', '🎓', '#16a34a', 'egitim-selcuk-universitesi'),
  ('Tıp Fakültesi', '⚕️', '#dc2626', 'tip-selcuk-universitesi'),
  ('Eczacılık Fakültesi', '💊', '#16a34a', 'eczacilik-selcuk-universitesi'),
  ('İletişim Fakültesi', '📡', '#d97706', 'iletisim-selcuk-universitesi'),
  ('Meslek Yüksekokulu', '🔧', '#64748b', 'meslek-yuksekokulu-selcuk-universitesi')
) AS v(ad, emoji, renk, slug)
WHERE u.slug = 'selcuk-universitesi'
ON CONFLICT (slug) DO NOTHING;

-- === Gaziantep Üniversitesi ===
INSERT INTO faculties (ad, emoji, renk, slug, university_id)
SELECT v.ad, v.emoji, v.renk, v.slug, u.id
FROM universities u
CROSS JOIN (VALUES
  ('Mühendislik Fakültesi', '⚙️', '#4f46e5', 'muhendislik-gaziantep-universitesi'),
  ('Fen-Edebiyat Fakültesi', '🔬', '#7c3aed', 'fen-edebiyat-gaziantep-universitesi'),
  ('İktisadi ve İdari Bilimler Fakültesi', '💼', '#0d9488', 'iibf-gaziantep-universitesi'),
  ('Hukuk Fakültesi', '⚖️', '#0891b2', 'hukuk-gaziantep-universitesi'),
  ('Eğitim Fakültesi', '🎓', '#16a34a', 'egitim-gaziantep-universitesi'),
  ('Tıp Fakültesi', '⚕️', '#dc2626', 'tip-gaziantep-universitesi'),
  ('Eczacılık Fakültesi', '💊', '#16a34a', 'eczacilik-gaziantep-universitesi'),
  ('Meslek Yüksekokulu', '🔧', '#64748b', 'meslek-yuksekokulu-gaziantep-universitesi')
) AS v(ad, emoji, renk, slug)
WHERE u.slug = 'gaziantep-universitesi'
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 4) Fakülteleri Bölümlerle Eşleştir (faculty_departments)
-- ============================================================
-- department_slug bazlı eşleştirme.
-- (faculty_id, department_slug) unique constraint varsa ON CONFLICT.

-- === İstanbul Teknik Üniversitesi (İTÜ) → bölüm eşleştirmeleri ===
INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'muhendislik-itu'
  AND d.slug IN ('bilgisayar-programciligi','arka-yuz-yazilim-gelistirme','oyun-gelistirme-ve-programlama','buyuk-veri-analistligi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'fen-edebiyat-itu'
  AND d.slug IN ('felsefe','sosyoloji','psikoloji','turk-dili-ve-edebiyati','arkeoloji','sanat-tarihi','rus-dili-ve-edebiyati')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iibf-itu'
  AND d.slug IN ('iktisat','isletme','maliye','calisma-ekonomisi-ve-endustri-iliskileri','bankacilik-ve-finans','muhasebe-ve-finans-yonetimi','pazarlama','siyaset-bilimi-ve-kamu-yonetimi','uluslararasi-iliskiler')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'mimarlik-itu'
  AND d.slug IN ('gorsel-iletisim-tasarimi','grafik-sanatlar','cizgi-film-ve-animasyon','dijital-oyun-tasarimi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'meslek-yuksekokulu-itu'
  AND d.slug IN ('adalet','ascilik','ofis-yonetimi-ve-sekreterlik','eczane-hizmetleri','cocuk-gelisimi','emlak-yonetimi','sac-bakimi-ve-guzellik-hizmetleri','tibbi-laboratuvar-teknikleri','dis-ticaret','bilgisayar-programciligi')
ON CONFLICT DO NOTHING;

-- === Marmara Üniversitesi → bölüm eşleştirmeleri ===
INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iibf-marmara-universitesi'
  AND d.slug IN ('iktisat','isletme','maliye','calisma-ekonomisi-ve-endustri-iliskileri','bankacilik-ve-finans','muhasebe-ve-finans-yonetimi','pazarlama','siyaset-bilimi-ve-kamu-yonetimi','uluslararasi-iliskiler')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'hukuk-marmara-universitesi'
  AND d.slug IN ('hukuk')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'egitim-marmara-universitesi'
  AND d.slug IN ('ingilizce-ogretmenligi','almanca-ogretmenligi','fransizca-ogretmenligi','sinif-ogretmenligi','okul-oncesi-ogretmenligi','sosyal-bilgiler-ogretmenligi','ilkogretim-matematik-ogretmenligi','bilgisayar-ve-ogretim-teknolojileri','ozel-egitim-ogretmenligi','rehberlik-ve-psikolojik-danismanlik')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iletisim-marmara-universitesi'
  AND d.slug IN ('gazetecilik','radyo-televizyon-ve-sinema','halkla-iliskiler-ve-tanitim','reklamcilik','iletisim-bilimleri','gorsel-iletisim-tasarimi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'guzel-sanatlar-marmara-universitesi'
  AND d.slug IN ('resim','heykel','seramik','grafik-sanatlar','gorsel-iletisim-tasarimi','cizgi-film-ve-animasyon','dijital-oyun-tasarimi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'tip-marmara-universitesi'
  AND d.slug IN ('tibbi-laboratuvar-teknikleri','beslenme-ve-diyetetik','dil-ve-konusma-terapisi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'meslek-yuksekokulu-marmara-universitesi'
  AND d.slug IN ('adalet','ascilik','ofis-yonetimi-ve-sekreterlik','eczane-hizmetleri','cocuk-gelisimi','emlak-yonetimi','sac-bakimi-ve-guzellik-hizmetleri','tibbi-laboratuvar-teknikleri','dis-ticaret','bilgisayar-programciligi')
ON CONFLICT DO NOTHING;

-- === Yıldız Teknik Üniversitesi → bölüm eşleştirmeleri ===
INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'muhendislik-yildiz-teknik-universitesi'
  AND d.slug IN ('bilgisayar-programciligi','arka-yuz-yazilim-gelistirme','oyun-gelistirme-ve-programlama','buyuk-veri-analistligi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'fen-edebiyat-yildiz-teknik-universitesi'
  AND d.slug IN ('felsefe','sosyoloji','psikoloji','turk-dili-ve-edebiyati','arkeoloji','sanat-tarihi','rus-dili-ve-edebiyati')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iibf-yildiz-teknik-universitesi'
  AND d.slug IN ('iktisat','isletme','maliye','calisma-ekonomisi-ve-endustri-iliskileri','bankacilik-ve-finans','muhasebe-ve-finans-yonetimi','pazarlama','siyaset-bilimi-ve-kamu-yonetimi','uluslararasi-iliskiler')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'mimarlik-yildiz-teknik-universitesi'
  AND d.slug IN ('gorsel-iletisim-tasarimi','grafik-sanatlar','cizgi-film-ve-animasyon','dijital-oyun-tasarimi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'meslek-yuksekokulu-yildiz-teknik-universitesi'
  AND d.slug IN ('adalet','ascilik','ofis-yonetimi-ve-sekreterlik','eczane-hizmetleri','cocuk-gelisimi','emlak-yonetimi','sac-bakimi-ve-guzellik-hizmetleri','tibbi-laboratuvar-teknikleri','dis-ticaret','bilgisayar-programciligi')
ON CONFLICT DO NOTHING;

-- === Dokuz Eylül Üniversitesi → bölüm eşleştirmeleri ===
INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'muhendislik-dokuz-eylul-universitesi'
  AND d.slug IN ('bilgisayar-programciligi','arka-yuz-yazilim-gelistirme','oyun-gelistirme-ve-programlama','buyuk-veri-analistligi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'fen-edebiyat-dokuz-eylul-universitesi'
  AND d.slug IN ('felsefe','sosyoloji','psikoloji','turk-dili-ve-edebiyati','arkeoloji','sanat-tarihi','rus-dili-ve-edebiyati')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iibf-dokuz-eylul-universitesi'
  AND d.slug IN ('iktisat','isletme','maliye','calisma-ekonomisi-ve-endustri-iliskileri','bankacilik-ve-finans','muhasebe-ve-finans-yonetimi','pazarlama','siyaset-bilimi-ve-kamu-yonetimi','uluslararasi-iliskiler')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'hukuk-dokuz-eylul-universitesi'
  AND d.slug IN ('hukuk')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'eczacilik-dokuz-eylul-universitesi'
  AND d.slug IN ('eczacilik','eczane-hizmetleri')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'tip-dokuz-eylul-universitesi'
  AND d.slug IN ('tibbi-laboratuvar-teknikleri','beslenme-ve-diyetetik','dil-ve-konusma-terapisi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iletisim-dokuz-eylul-universitesi'
  AND d.slug IN ('gazetecilik','radyo-televizyon-ve-sinema','halkla-iliskiler-ve-tanitim','reklamcilik','iletisim-bilimleri','gorsel-iletisim-tasarimi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'turizm-dokuz-eylul-universitesi'
  AND d.slug IN ('turizm-rehberligi','turizm-ve-otel-isletmeciligi','gastronomi-ve-mutfak-sanatlari')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'meslek-yuksekokulu-dokuz-eylul-universitesi'
  AND d.slug IN ('adalet','ascilik','ofis-yonetimi-ve-sekreterlik','eczane-hizmetleri','cocuk-gelisimi','emlak-yonetimi','sac-bakimi-ve-guzellik-hizmetleri','tibbi-laboratuvar-teknikleri','dis-ticaret','bilgisayar-programciligi')
ON CONFLICT DO NOTHING;

-- === Gazi Üniversitesi → bölüm eşleştirmeleri ===
INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'muhendislik-gazi-universitesi'
  AND d.slug IN ('bilgisayar-programciligi','arka-yuz-yazilim-gelistirme','oyun-gelistirme-ve-programlama','buyuk-veri-analistligi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'fen-edebiyat-gazi-universitesi'
  AND d.slug IN ('felsefe','sosyoloji','psikoloji','turk-dili-ve-edebiyati','arkeoloji','sanat-tarihi','rus-dili-ve-edebiyati')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iibf-gazi-universitesi'
  AND d.slug IN ('iktisat','isletme','maliye','calisma-ekonomisi-ve-endustri-iliskileri','bankacilik-ve-finans','muhasebe-ve-finans-yonetimi','pazarlama','siyaset-bilimi-ve-kamu-yonetimi','uluslararasi-iliskiler')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'hukuk-gazi-universitesi'
  AND d.slug IN ('hukuk')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'egitim-gazi-universitesi'
  AND d.slug IN ('ingilizce-ogretmenligi','almanca-ogretmenligi','fransizca-ogretmenligi','sinif-ogretmenligi','okul-oncesi-ogretmenligi','sosyal-bilgiler-ogretmenligi','ilkogretim-matematik-ogretmenligi','bilgisayar-ve-ogretim-teknolojileri','ozel-egitim-ogretmenligi','rehberlik-ve-psikolojik-danismanlik')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iletisim-gazi-universitesi'
  AND d.slug IN ('gazetecilik','radyo-televizyon-ve-sinema','halkla-iliskiler-ve-tanitim','reklamcilik','iletisim-bilimleri','gorsel-iletisim-tasarimi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'tip-gazi-universitesi'
  AND d.slug IN ('tibbi-laboratuvar-teknikleri','beslenme-ve-diyetetik','dil-ve-konusma-terapisi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'meslek-yuksekokulu-gazi-universitesi'
  AND d.slug IN ('adalet','ascilik','ofis-yonetimi-ve-sekreterlik','eczane-hizmetleri','cocuk-gelisimi','emlak-yonetimi','sac-bakimi-ve-guzellik-hizmetleri','tibbi-laboratuvar-teknikleri','dis-ticaret','bilgisayar-programciligi')
ON CONFLICT DO NOTHING;

-- === Gebze Teknik Üniversitesi → bölüm eşleştirmeleri ===
INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'muhendislik-gebze-teknik-universitesi'
  AND d.slug IN ('bilgisayar-programciligi','arka-yuz-yazilim-gelistirme','oyun-gelistirme-ve-programlama','buyuk-veri-analistligi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'fen-edebiyat-gebze-teknik-universitesi'
  AND d.slug IN ('felsefe','sosyoloji','psikoloji','turk-dili-ve-edebiyati','arkeoloji','sanat-tarihi','rus-dili-ve-edebiyati')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iibf-gebze-teknik-universitesi'
  AND d.slug IN ('iktisat','isletme','maliye','calisma-ekonomisi-ve-endustri-iliskileri','bankacilik-ve-finans','muhasebe-ve-finans-yonetimi','pazarlama','siyaset-bilimi-ve-kamu-yonetimi','uluslararasi-iliskiler')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'mimarlik-gebze-teknik-universitesi'
  AND d.slug IN ('gorsel-iletisim-tasarimi','grafik-sanatlar','cizgi-film-ve-animasyon','dijital-oyun-tasarimi')
ON CONFLICT DO NOTHING;

-- === Eskişehir Teknik Üniversitesi → bölüm eşleştirmeleri ===
INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'muhendislik-eskisehir-teknik-universitesi'
  AND d.slug IN ('bilgisayar-programciligi','arka-yuz-yazilim-gelistirme','oyun-gelistirme-ve-programlama','buyuk-veri-analistligi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'fen-edebiyat-eskisehir-teknik-universitesi'
  AND d.slug IN ('felsefe','sosyoloji','psikoloji','turk-dili-ve-edebiyati','arkeoloji','sanat-tarihi','rus-dili-ve-edebiyati')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iibf-eskisehir-teknik-universitesi'
  AND d.slug IN ('iktisat','isletme','maliye','calisma-ekonomisi-ve-endustri-iliskileri','bankacilik-ve-finans','muhasebe-ve-finans-yonetimi','pazarlama','siyaset-bilimi-ve-kamu-yonetimi','uluslararasi-iliskiler')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'mimarlik-eskisehir-teknik-universitesi'
  AND d.slug IN ('gorsel-iletisim-tasarimi','grafik-sanatlar','cizgi-film-ve-animasyon','dijital-oyun-tasarimi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'turizm-eskisehir-teknik-universitesi'
  AND d.slug IN ('turizm-rehberligi','turizm-ve-otel-isletmeciligi','gastronomi-ve-mutfak-sanatlari')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'meslek-yuksekokulu-eskisehir-teknik-universitesi'
  AND d.slug IN ('adalet','ascilik','ofis-yonetimi-ve-sekreterlik','eczane-hizmetleri','cocuk-gelisimi','emlak-yonetimi','sac-bakimi-ve-guzellik-hizmetleri','tibbi-laboratuvar-teknikleri','dis-ticaret','bilgisayar-programciligi')
ON CONFLICT DO NOTHING;

-- === Galatasaray Üniversitesi → bölüm eşleştirmeleri ===
INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iibf-galatasaray-universitesi'
  AND d.slug IN ('iktisat','isletme','maliye','calisma-ekonomisi-ve-endustri-iliskileri','bankacilik-ve-finans','muhasebe-ve-finans-yonetimi','pazarlama','siyaset-bilimi-ve-kamu-yonetimi','uluslararasi-iliskiler')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'hukuk-galatasaray-universitesi'
  AND d.slug IN ('hukuk')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'fen-edebiyat-galatasaray-universitesi'
  AND d.slug IN ('felsefe','sosyoloji','psikoloji','turk-dili-ve-edebiyati','arkeoloji','sanat-tarihi','rus-dili-ve-edebiyati')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iletisim-galatasaray-universitesi'
  AND d.slug IN ('gazetecilik','radyo-televizyon-ve-sinema','halkla-iliskiler-ve-tanitim','reklamcilik','iletisim-bilimleri','gorsel-iletisim-tasarimi')
ON CONFLICT DO NOTHING;

-- === İzmir Yüksek Teknoloji Enstitüsü (İYTE) → bölüm eşleştirmeleri ===
INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'muhendislik-iyte'
  AND d.slug IN ('bilgisayar-programciligi','arka-yuz-yazilim-gelistirme','oyun-gelistirme-ve-programlama','buyuk-veri-analistligi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'fen-edebiyat-iyte'
  AND d.slug IN ('felsefe','sosyoloji','psikoloji','turk-dili-ve-edebiyati','arkeoloji','sanat-tarihi','rus-dili-ve-edebiyati')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iibf-iyte'
  AND d.slug IN ('iktisat','isletme','maliye','calisma-ekonomisi-ve-endustri-iliskileri','bankacilik-ve-finans','muhasebe-ve-finans-yonetimi','pazarlama','siyaset-bilimi-ve-kamu-yonetimi','uluslararasi-iliskiler')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'mimarlik-iyte'
  AND d.slug IN ('gorsel-iletisim-tasarimi','grafik-sanatlar','cizgi-film-ve-animasyon','dijital-oyun-tasarimi')
ON CONFLICT DO NOTHING;

-- === Akdeniz Üniversitesi → bölüm eşleştirmeleri ===
INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iibf-akdeniz-universitesi'
  AND d.slug IN ('iktisat','isletme','maliye','calisma-ekonomisi-ve-endustri-iliskileri','bankacilik-ve-finans','muhasebe-ve-finans-yonetimi','pazarlama','siyaset-bilimi-ve-kamu-yonetimi','uluslararasi-iliskiler')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'hukuk-akdeniz-universitesi'
  AND d.slug IN ('hukuk')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'egitim-akdeniz-universitesi'
  AND d.slug IN ('ingilizce-ogretmenligi','almanca-ogretmenligi','fransizca-ogretmenligi','sinif-ogretmenligi','okul-oncesi-ogretmenligi','sosyal-bilgiler-ogretmenligi','ilkogretim-matematik-ogretmenligi','bilgisayar-ve-ogretim-teknolojileri','ozel-egitim-ogretmenligi','rehberlik-ve-psikolojik-danismanlik')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'tip-akdeniz-universitesi'
  AND d.slug IN ('tibbi-laboratuvar-teknikleri','beslenme-ve-diyetetik','dil-ve-konusma-terapisi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'eczacilik-akdeniz-universitesi'
  AND d.slug IN ('eczacilik','eczane-hizmetleri')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'turizm-akdeniz-universitesi'
  AND d.slug IN ('turizm-rehberligi','turizm-ve-otel-isletmeciligi','gastronomi-ve-mutfak-sanatlari')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iletisim-akdeniz-universitesi'
  AND d.slug IN ('gazetecilik','radyo-televizyon-ve-sinema','halkla-iliskiler-ve-tanitim','reklamcilik','iletisim-bilimleri','gorsel-iletisim-tasarimi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'meslek-yuksekokulu-akdeniz-universitesi'
  AND d.slug IN ('adalet','ascilik','ofis-yonetimi-ve-sekreterlik','eczane-hizmetleri','cocuk-gelisimi','emlak-yonetimi','sac-bakimi-ve-guzellik-hizmetleri','tibbi-laboratuvar-teknikleri','dis-ticaret','bilgisayar-programciligi')
ON CONFLICT DO NOTHING;

-- === Bursa Uludağ Üniversitesi → bölüm eşleştirmeleri ===
INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'muhendislik-bursa-uludag-universitesi'
  AND d.slug IN ('bilgisayar-programciligi','arka-yuz-yazilim-gelistirme','oyun-gelistirme-ve-programlama','buyuk-veri-analistligi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'fen-edebiyat-bursa-uludag-universitesi'
  AND d.slug IN ('felsefe','sosyoloji','psikoloji','turk-dili-ve-edebiyati','arkeoloji','sanat-tarihi','rus-dili-ve-edebiyati')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iibf-bursa-uludag-universitesi'
  AND d.slug IN ('iktisat','isletme','maliye','calisma-ekonomisi-ve-endustri-iliskileri','bankacilik-ve-finans','muhasebe-ve-finans-yonetimi','pazarlama','siyaset-bilimi-ve-kamu-yonetimi','uluslararasi-iliskiler')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'hukuk-bursa-uludag-universitesi'
  AND d.slug IN ('hukuk')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'egitim-bursa-uludag-universitesi'
  AND d.slug IN ('ingilizce-ogretmenligi','almanca-ogretmenligi','fransizca-ogretmenligi','sinif-ogretmenligi','okul-oncesi-ogretmenligi','sosyal-bilgiler-ogretmenligi','ilkogretim-matematik-ogretmenligi','bilgisayar-ve-ogretim-teknolojileri','ozel-egitim-ogretmenligi','rehberlik-ve-psikolojik-danismanlik')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'tip-bursa-uludag-universitesi'
  AND d.slug IN ('tibbi-laboratuvar-teknikleri','beslenme-ve-diyetetik','dil-ve-konusma-terapisi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'eczacilik-bursa-uludag-universitesi'
  AND d.slug IN ('eczacilik','eczane-hizmetleri')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'turizm-bursa-uludag-universitesi'
  AND d.slug IN ('turizm-rehberligi','turizm-ve-otel-isletmeciligi','gastronomi-ve-mutfak-sanatlari')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'meslek-yuksekokulu-bursa-uludag-universitesi'
  AND d.slug IN ('adalet','ascilik','ofis-yonetimi-ve-sekreterlik','eczane-hizmetleri','cocuk-gelisimi','emlak-yonetimi','sac-bakimi-ve-guzellik-hizmetleri','tibbi-laboratuvar-teknikleri','dis-ticaret','bilgisayar-programciligi')
ON CONFLICT DO NOTHING;

-- === Sakarya Üniversitesi → bölüm eşleştirmeleri ===
INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'muhendislik-sakarya-universitesi'
  AND d.slug IN ('bilgisayar-programciligi','arka-yuz-yazilim-gelistirme','oyun-gelistirme-ve-programlama','buyuk-veri-analistligi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'fen-edebiyat-sakarya-universitesi'
  AND d.slug IN ('felsefe','sosyoloji','psikoloji','turk-dili-ve-edebiyati','arkeoloji','sanat-tarihi','rus-dili-ve-edebiyati')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iibf-sakarya-universitesi'
  AND d.slug IN ('iktisat','isletme','maliye','calisma-ekonomisi-ve-endustri-iliskileri','bankacilik-ve-finans','muhasebe-ve-finans-yonetimi','pazarlama','siyaset-bilimi-ve-kamu-yonetimi','uluslararasi-iliskiler')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'egitim-sakarya-universitesi'
  AND d.slug IN ('ingilizce-ogretmenligi','almanca-ogretmenligi','fransizca-ogretmenligi','sinif-ogretmenligi','okul-oncesi-ogretmenligi','sosyal-bilgiler-ogretmenligi','ilkogretim-matematik-ogretmenligi','bilgisayar-ve-ogretim-teknolojileri','ozel-egitim-ogretmenligi','rehberlik-ve-psikolojik-danismanlik')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iletisim-sakarya-universitesi'
  AND d.slug IN ('gazetecilik','radyo-televizyon-ve-sinema','halkla-iliskiler-ve-tanitim','reklamcilik','iletisim-bilimleri','gorsel-iletisim-tasarimi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'meslek-yuksekokulu-sakarya-universitesi'
  AND d.slug IN ('adalet','ascilik','ofis-yonetimi-ve-sekreterlik','eczane-hizmetleri','cocuk-gelisimi','emlak-yonetimi','sac-bakimi-ve-guzellik-hizmetleri','tibbi-laboratuvar-teknikleri','dis-ticaret','bilgisayar-programciligi')
ON CONFLICT DO NOTHING;

-- === Karadeniz Teknik Üniversitesi → bölüm eşleştirmeleri ===
INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'muhendislik-karadeniz-teknik-universitesi'
  AND d.slug IN ('bilgisayar-programciligi','arka-yuz-yazilim-gelistirme','oyun-gelistirme-ve-programlama','buyuk-veri-analistligi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'fen-edebiyat-karadeniz-teknik-universitesi'
  AND d.slug IN ('felsefe','sosyoloji','psikoloji','turk-dili-ve-edebiyati','arkeoloji','sanat-tarihi','rus-dili-ve-edebiyati')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iibf-karadeniz-teknik-universitesi'
  AND d.slug IN ('iktisat','isletme','maliye','calisma-ekonomisi-ve-endustri-iliskileri','bankacilik-ve-finans','muhasebe-ve-finans-yonetimi','pazarlama','siyaset-bilimi-ve-kamu-yonetimi','uluslararasi-iliskiler')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'hukuk-karadeniz-teknik-universitesi'
  AND d.slug IN ('hukuk')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'egitim-karadeniz-teknik-universitesi'
  AND d.slug IN ('ingilizce-ogretmenligi','almanca-ogretmenligi','fransizca-ogretmenligi','sinif-ogretmenligi','okul-oncesi-ogretmenligi','sosyal-bilgiler-ogretmenligi','ilkogretim-matematik-ogretmenligi','bilgisayar-ve-ogretim-teknolojileri','ozel-egitim-ogretmenligi','rehberlik-ve-psikolojik-danismanlik')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'tip-karadeniz-teknik-universitesi'
  AND d.slug IN ('tibbi-laboratuvar-teknikleri','beslenme-ve-diyetetik','dil-ve-konusma-terapisi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'eczacilik-karadeniz-teknik-universitesi'
  AND d.slug IN ('eczacilik','eczane-hizmetleri')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'meslek-yuksekokulu-karadeniz-teknik-universitesi'
  AND d.slug IN ('adalet','ascilik','ofis-yonetimi-ve-sekreterlik','eczane-hizmetleri','cocuk-gelisimi','emlak-yonetimi','sac-bakimi-ve-guzellik-hizmetleri','tibbi-laboratuvar-teknikleri','dis-ticaret','bilgisayar-programciligi')
ON CONFLICT DO NOTHING;

-- === Çukurova Üniversitesi → bölüm eşleştirmeleri ===
INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'muhendislik-cukurova-universitesi'
  AND d.slug IN ('bilgisayar-programciligi','arka-yuz-yazilim-gelistirme','oyun-gelistirme-ve-programlama','buyuk-veri-analistligi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'fen-edebiyat-cukurova-universitesi'
  AND d.slug IN ('felsefe','sosyoloji','psikoloji','turk-dili-ve-edebiyati','arkeoloji','sanat-tarihi','rus-dili-ve-edebiyati')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iibf-cukurova-universitesi'
  AND d.slug IN ('iktisat','isletme','maliye','calisma-ekonomisi-ve-endustri-iliskileri','bankacilik-ve-finans','muhasebe-ve-finans-yonetimi','pazarlama','siyaset-bilimi-ve-kamu-yonetimi','uluslararasi-iliskiler')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'hukuk-cukurova-universitesi'
  AND d.slug IN ('hukuk')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'egitim-cukurova-universitesi'
  AND d.slug IN ('ingilizce-ogretmenligi','almanca-ogretmenligi','fransizca-ogretmenligi','sinif-ogretmenligi','okul-oncesi-ogretmenligi','sosyal-bilgiler-ogretmenligi','ilkogretim-matematik-ogretmenligi','bilgisayar-ve-ogretim-teknolojileri','ozel-egitim-ogretmenligi','rehberlik-ve-psikolojik-danismanlik')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'tip-cukurova-universitesi'
  AND d.slug IN ('tibbi-laboratuvar-teknikleri','beslenme-ve-diyetetik','dil-ve-konusma-terapisi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'eczacilik-cukurova-universitesi'
  AND d.slug IN ('eczacilik','eczane-hizmetleri')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'turizm-cukurova-universitesi'
  AND d.slug IN ('turizm-rehberligi','turizm-ve-otel-isletmeciligi','gastronomi-ve-mutfak-sanatlari')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'meslek-yuksekokulu-cukurova-universitesi'
  AND d.slug IN ('adalet','ascilik','ofis-yonetimi-ve-sekreterlik','eczane-hizmetleri','cocuk-gelisimi','emlak-yonetimi','sac-bakimi-ve-guzellik-hizmetleri','tibbi-laboratuvar-teknikleri','dis-ticaret','bilgisayar-programciligi')
ON CONFLICT DO NOTHING;

-- === Erciyes Üniversitesi → bölüm eşleştirmeleri ===
INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'muhendislik-erciyes-universitesi'
  AND d.slug IN ('bilgisayar-programciligi','arka-yuz-yazilim-gelistirme','oyun-gelistirme-ve-programlama','buyuk-veri-analistligi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'fen-edebiyat-erciyes-universitesi'
  AND d.slug IN ('felsefe','sosyoloji','psikoloji','turk-dili-ve-edebiyati','arkeoloji','sanat-tarihi','rus-dili-ve-edebiyati')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iibf-erciyes-universitesi'
  AND d.slug IN ('iktisat','isletme','maliye','calisma-ekonomisi-ve-endustri-iliskileri','bankacilik-ve-finans','muhasebe-ve-finans-yonetimi','pazarlama','siyaset-bilimi-ve-kamu-yonetimi','uluslararasi-iliskiler')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'hukuk-erciyes-universitesi'
  AND d.slug IN ('hukuk')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'egitim-erciyes-universitesi'
  AND d.slug IN ('ingilizce-ogretmenligi','almanca-ogretmenligi','fransizca-ogretmenligi','sinif-ogretmenligi','okul-oncesi-ogretmenligi','sosyal-bilgiler-ogretmenligi','ilkogretim-matematik-ogretmenligi','bilgisayar-ve-ogretim-teknolojileri','ozel-egitim-ogretmenligi','rehberlik-ve-psikolojik-danismanlik')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'tip-erciyes-universitesi'
  AND d.slug IN ('tibbi-laboratuvar-teknikleri','beslenme-ve-diyetetik','dil-ve-konusma-terapisi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'eczacilik-erciyes-universitesi'
  AND d.slug IN ('eczacilik','eczane-hizmetleri')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'meslek-yuksekokulu-erciyes-universitesi'
  AND d.slug IN ('adalet','ascilik','ofis-yonetimi-ve-sekreterlik','eczane-hizmetleri','cocuk-gelisimi','emlak-yonetimi','sac-bakimi-ve-guzellik-hizmetleri','tibbi-laboratuvar-teknikleri','dis-ticaret','bilgisayar-programciligi')
ON CONFLICT DO NOTHING;

-- === Atatürk Üniversitesi → bölüm eşleştirmeleri ===
INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'muhendislik-ataturk-universitesi'
  AND d.slug IN ('bilgisayar-programciligi','arka-yuz-yazilim-gelistirme','oyun-gelistirme-ve-programlama','buyuk-veri-analistligi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'fen-edebiyat-ataturk-universitesi'
  AND d.slug IN ('felsefe','sosyoloji','psikoloji','turk-dili-ve-edebiyati','arkeoloji','sanat-tarihi','rus-dili-ve-edebiyati')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iibf-ataturk-universitesi'
  AND d.slug IN ('iktisat','isletme','maliye','calisma-ekonomisi-ve-endustri-iliskileri','bankacilik-ve-finans','muhasebe-ve-finans-yonetimi','pazarlama','siyaset-bilimi-ve-kamu-yonetimi','uluslararasi-iliskiler')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'hukuk-ataturk-universitesi'
  AND d.slug IN ('hukuk')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'egitim-ataturk-universitesi'
  AND d.slug IN ('ingilizce-ogretmenligi','almanca-ogretmenligi','fransizca-ogretmenligi','sinif-ogretmenligi','okul-oncesi-ogretmenligi','sosyal-bilgiler-ogretmenligi','ilkogretim-matematik-ogretmenligi','bilgisayar-ve-ogretim-teknolojileri','ozel-egitim-ogretmenligi','rehberlik-ve-psikolojik-danismanlik')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'tip-ataturk-universitesi'
  AND d.slug IN ('tibbi-laboratuvar-teknikleri','beslenme-ve-diyetetik','dil-ve-konusma-terapisi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'eczacilik-ataturk-universitesi'
  AND d.slug IN ('eczacilik','eczane-hizmetleri')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iletisim-ataturk-universitesi'
  AND d.slug IN ('gazetecilik','radyo-televizyon-ve-sinema','halkla-iliskiler-ve-tanitim','reklamcilik','iletisim-bilimleri','gorsel-iletisim-tasarimi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'meslek-yuksekokulu-ataturk-universitesi'
  AND d.slug IN ('adalet','ascilik','ofis-yonetimi-ve-sekreterlik','eczane-hizmetleri','cocuk-gelisimi','emlak-yonetimi','sac-bakimi-ve-guzellik-hizmetleri','tibbi-laboratuvar-teknikleri','dis-ticaret','bilgisayar-programciligi')
ON CONFLICT DO NOTHING;

-- === Pamukkale Üniversitesi → bölüm eşleştirmeleri ===
INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'muhendislik-pamukkale-universitesi'
  AND d.slug IN ('bilgisayar-programciligi','arka-yuz-yazilim-gelistirme','oyun-gelistirme-ve-programlama','buyuk-veri-analistligi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'fen-edebiyat-pamukkale-universitesi'
  AND d.slug IN ('felsefe','sosyoloji','psikoloji','turk-dili-ve-edebiyati','arkeoloji','sanat-tarihi','rus-dili-ve-edebiyati')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iibf-pamukkale-universitesi'
  AND d.slug IN ('iktisat','isletme','maliye','calisma-ekonomisi-ve-endustri-iliskileri','bankacilik-ve-finans','muhasebe-ve-finans-yonetimi','pazarlama','siyaset-bilimi-ve-kamu-yonetimi','uluslararasi-iliskiler')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'egitim-pamukkale-universitesi'
  AND d.slug IN ('ingilizce-ogretmenligi','almanca-ogretmenligi','fransizca-ogretmenligi','sinif-ogretmenligi','okul-oncesi-ogretmenligi','sosyal-bilgiler-ogretmenligi','ilkogretim-matematik-ogretmenligi','bilgisayar-ve-ogretim-teknolojileri','ozel-egitim-ogretmenligi','rehberlik-ve-psikolojik-danismanlik')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'tip-pamukkale-universitesi'
  AND d.slug IN ('tibbi-laboratuvar-teknikleri','beslenme-ve-diyetetik','dil-ve-konusma-terapisi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'turizm-pamukkale-universitesi'
  AND d.slug IN ('turizm-rehberligi','turizm-ve-otel-isletmeciligi','gastronomi-ve-mutfak-sanatlari')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'meslek-yuksekokulu-pamukkale-universitesi'
  AND d.slug IN ('adalet','ascilik','ofis-yonetimi-ve-sekreterlik','eczane-hizmetleri','cocuk-gelisimi','emlak-yonetimi','sac-bakimi-ve-guzellik-hizmetleri','tibbi-laboratuvar-teknikleri','dis-ticaret','bilgisayar-programciligi')
ON CONFLICT DO NOTHING;

-- === Kocaeli Üniversitesi → bölüm eşleştirmeleri ===
INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'muhendislik-kocaeli-universitesi'
  AND d.slug IN ('bilgisayar-programciligi','arka-yuz-yazilim-gelistirme','oyun-gelistirme-ve-programlama','buyuk-veri-analistligi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'fen-edebiyat-kocaeli-universitesi'
  AND d.slug IN ('felsefe','sosyoloji','psikoloji','turk-dili-ve-edebiyati','arkeoloji','sanat-tarihi','rus-dili-ve-edebiyati')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iibf-kocaeli-universitesi'
  AND d.slug IN ('iktisat','isletme','maliye','calisma-ekonomisi-ve-endustri-iliskileri','bankacilik-ve-finans','muhasebe-ve-finans-yonetimi','pazarlama','siyaset-bilimi-ve-kamu-yonetimi','uluslararasi-iliskiler')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'hukuk-kocaeli-universitesi'
  AND d.slug IN ('hukuk')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'egitim-kocaeli-universitesi'
  AND d.slug IN ('ingilizce-ogretmenligi','almanca-ogretmenligi','fransizca-ogretmenligi','sinif-ogretmenligi','okul-oncesi-ogretmenligi','sosyal-bilgiler-ogretmenligi','ilkogretim-matematik-ogretmenligi','bilgisayar-ve-ogretim-teknolojileri','ozel-egitim-ogretmenligi','rehberlik-ve-psikolojik-danismanlik')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'tip-kocaeli-universitesi'
  AND d.slug IN ('tibbi-laboratuvar-teknikleri','beslenme-ve-diyetetik','dil-ve-konusma-terapisi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iletisim-kocaeli-universitesi'
  AND d.slug IN ('gazetecilik','radyo-televizyon-ve-sinema','halkla-iliskiler-ve-tanitim','reklamcilik','iletisim-bilimleri','gorsel-iletisim-tasarimi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'meslek-yuksekokulu-kocaeli-universitesi'
  AND d.slug IN ('adalet','ascilik','ofis-yonetimi-ve-sekreterlik','eczane-hizmetleri','cocuk-gelisimi','emlak-yonetimi','sac-bakimi-ve-guzellik-hizmetleri','tibbi-laboratuvar-teknikleri','dis-ticaret','bilgisayar-programciligi')
ON CONFLICT DO NOTHING;

-- === Selçuk Üniversitesi → bölüm eşleştirmeleri ===
INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'muhendislik-selcuk-universitesi'
  AND d.slug IN ('bilgisayar-programciligi','arka-yuz-yazilim-gelistirme','oyun-gelistirme-ve-programlama','buyuk-veri-analistligi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'fen-edebiyat-selcuk-universitesi'
  AND d.slug IN ('felsefe','sosyoloji','psikoloji','turk-dili-ve-edebiyati','arkeoloji','sanat-tarihi','rus-dili-ve-edebiyati')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iibf-selcuk-universitesi'
  AND d.slug IN ('iktisat','isletme','maliye','calisma-ekonomisi-ve-endustri-iliskileri','bankacilik-ve-finans','muhasebe-ve-finans-yonetimi','pazarlama','siyaset-bilimi-ve-kamu-yonetimi','uluslararasi-iliskiler')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'hukuk-selcuk-universitesi'
  AND d.slug IN ('hukuk')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'egitim-selcuk-universitesi'
  AND d.slug IN ('ingilizce-ogretmenligi','almanca-ogretmenligi','fransizca-ogretmenligi','sinif-ogretmenligi','okul-oncesi-ogretmenligi','sosyal-bilgiler-ogretmenligi','ilkogretim-matematik-ogretmenligi','bilgisayar-ve-ogretim-teknolojileri','ozel-egitim-ogretmenligi','rehberlik-ve-psikolojik-danismanlik')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'tip-selcuk-universitesi'
  AND d.slug IN ('tibbi-laboratuvar-teknikleri','beslenme-ve-diyetetik','dil-ve-konusma-terapisi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'eczacilik-selcuk-universitesi'
  AND d.slug IN ('eczacilik','eczane-hizmetleri')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iletisim-selcuk-universitesi'
  AND d.slug IN ('gazetecilik','radyo-televizyon-ve-sinema','halkla-iliskiler-ve-tanitim','reklamcilik','iletisim-bilimleri','gorsel-iletisim-tasarimi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'meslek-yuksekokulu-selcuk-universitesi'
  AND d.slug IN ('adalet','ascilik','ofis-yonetimi-ve-sekreterlik','eczane-hizmetleri','cocuk-gelisimi','emlak-yonetimi','sac-bakimi-ve-guzellik-hizmetleri','tibbi-laboratuvar-teknikleri','dis-ticaret','bilgisayar-programciligi')
ON CONFLICT DO NOTHING;

-- === Gaziantep Üniversitesi → bölüm eşleştirmeleri ===
INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'muhendislik-gaziantep-universitesi'
  AND d.slug IN ('bilgisayar-programciligi','arka-yuz-yazilim-gelistirme','oyun-gelistirme-ve-programlama','buyuk-veri-analistligi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'fen-edebiyat-gaziantep-universitesi'
  AND d.slug IN ('felsefe','sosyoloji','psikoloji','turk-dili-ve-edebiyati','arkeoloji','sanat-tarihi','rus-dili-ve-edebiyati')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'iibf-gaziantep-universitesi'
  AND d.slug IN ('iktisat','isletme','maliye','calisma-ekonomisi-ve-endustri-iliskileri','bankacilik-ve-finans','muhasebe-ve-finans-yonetimi','pazarlama','siyaset-bilimi-ve-kamu-yonetimi','uluslararasi-iliskiler')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'hukuk-gaziantep-universitesi'
  AND d.slug IN ('hukuk')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'egitim-gaziantep-universitesi'
  AND d.slug IN ('ingilizce-ogretmenligi','almanca-ogretmenligi','fransizca-ogretmenligi','sinif-ogretmenligi','okul-oncesi-ogretmenligi','sosyal-bilgiler-ogretmenligi','ilkogretim-matematik-ogretmenligi','bilgisayar-ve-ogretim-teknolojileri','ozel-egitim-ogretmenligi','rehberlik-ve-psikolojik-danismanlik')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'tip-gaziantep-universitesi'
  AND d.slug IN ('tibbi-laboratuvar-teknikleri','beslenme-ve-diyetetik','dil-ve-konusma-terapisi')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'eczacilik-gaziantep-universitesi'
  AND d.slug IN ('eczacilik','eczane-hizmetleri')
ON CONFLICT DO NOTHING;

INSERT INTO faculty_departments (faculty_id, department_slug)
SELECT f.id, d.slug
FROM faculties f
CROSS JOIN departments d
WHERE f.slug = 'meslek-yuksekokulu-gaziantep-universitesi'
  AND d.slug IN ('adalet','ascilik','ofis-yonetimi-ve-sekreterlik','eczane-hizmetleri','cocuk-gelisimi','emlak-yonetimi','sac-bakimi-ve-guzellik-hizmetleri','tibbi-laboratuvar-teknikleri','dis-ticaret','bilgisayar-programciligi')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5) 56 Bölümün Müfredatlarını Ekle (idempotent)
-- ============================================================
-- Her bölüm için: eğer bölümde hiç ders yoksa, tüm müfredatı ekle.
-- NOT EXISTS subquery ile kontrol edilir.
-- Tekrar çalıştırılırsa, zaten ders olan bölümler atlanır.

-- === Adalet (adalet) — 28 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Türk Hukuk Sistemi', 5, 4, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Anayasa Hukuku', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Medeni Hukuka Giriş', 5, 4, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Hukuk Başlangıcı', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Atatürk İlkeleri ve İnkılap Tarihi I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Yabancı Dil I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Bilgisayar Kullanımı', 3, 3, 0.3, 0.3, 0, 0.4, 1, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Ceza Hukuku Genel Hükümler', 5, 4, 0.4, 0, 0, 0.6, 2, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Borçlar Hukuku Genel Hükümler', 5, 4, 0.4, 0, 0, 0.6, 2, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'İdare Hukuku', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Eşya Hukuku', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Atatürk İlkeleri ve İnkılap Tarihi II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Yabancı Dil II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Ceza Muhakemesi Hukuku', 5, 4, 0.4, 0, 0, 0.6, 3, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Ticaret Hukuku', 5, 4, 0.4, 0, 0, 0.6, 3, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Aile Hukuku', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Medeni Usul Hukuku', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Devlet Teşkilatı', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'İnfaz Hukuku', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'İcra ve İflas Hukuku', 5, 4, 0.4, 0, 0, 0.6, 4, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'İş Hukuku', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Kamu Hukuku Uygulamaları', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Adli Tıp', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Noterlik Hukuku', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid, 'Staj', 4, 0, 0, 0.5, 0.5, 0, 4, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = 'e7c2b69f-dd0b-4aff-89a5-9656746a5a20'::uuid LIMIT 1
);

-- === Almanca Ogretmenligi (almanca-ogretmenligi) — 52 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Almanca Dilbilgisi I', 4, 4, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Almanca Okuma I', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Almanca Yazma I', 3, 3, 0.3, 0.3, 0, 0.4, 1, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Almanca Konuşma I', 3, 3, 0.4, 0.1, 0.1, 0.4, 1, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Alman Edebiyatına Giriş', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Yabancı Dil I (İngilizce)', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Almanca Dilbilgisi II', 4, 4, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Almanca Okuma II', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Almanca Yazma II', 3, 3, 0.3, 0.3, 0, 0.4, 2, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Almanca Konuşma II', 3, 3, 0.4, 0.1, 0.1, 0.4, 2, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Alman Edebiyatı Tarihi', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Yabancı Dil II (İngilizce)', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Almanca Çeviri I', 4, 4, 0.3, 0.3, 0, 0.4, 3, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Alman Edebiyatı Klasikleri', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Öğretim İlke ve Yöntemleri', 4, 4, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Alman Kültürü ve Medeniyeti', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Almanca Sözlü İletişim', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Linguistik I', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Bilgisayar Becerileri', 2, 2, 0.3, 0.3, 0.1, 0.3, 3, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Almanca Çeviri II', 4, 4, 0.3, 0.3, 0, 0.4, 4, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Çağdaş Alman Edebiyatı', 3, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Öğretim Teknolojileri', 3, 3, 0.3, 0.3, 0.1, 0.3, 4, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Alman Sineması', 3, 3, 0.3, 0.2, 0.2, 0.3, 4, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Linguistik II', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Sınıf Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Özel Öğretim Yöntemleri I', 3, 3, 0.3, 0.3, 0.1, 0.3, 4, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Alman Edebiyatı Analizi', 4, 4, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Çocuk Edebiyatı', 3, 3, 0.3, 0.3, 0.1, 0.3, 5, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Ölçme ve Değerlendirme', 4, 4, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Özel Öğretim Yöntemleri II', 3, 3, 0.3, 0.3, 0.1, 0.3, 5, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Almanca Akademik Yazım', 3, 3, 0.3, 0.4, 0, 0.3, 5, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Rehberlik', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Alman Dili ve Edebiyatı Semineri', 4, 4, 0.2, 0.3, 0.2, 0.3, 6, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Karşılaştırmalı Edebiyat', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Topluma Hizmet Uygulamaları', 2, 2, 0, 0.5, 0.3, 0.2, 6, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Almanca İş Almanca', 3, 3, 0.3, 0.3, 0, 0.4, 6, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Türk-Alman Kültürel İlişkileri', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Okuma Eğitimi', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Öğretmenlik Uygulaması I', 5, 5, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Alman Eğitim Sistemi', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Çeviri Uygulamaları', 3, 3, 0.3, 0.3, 0.1, 0.3, 7, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'AVrupa Birliği ve Almanya', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Bitirme Çalışması I', 3, 3, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Öğretmenlik Uygulaması II', 5, 5, 0.2, 0.3, 0.3, 0.2, 8, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Bitirme Çalışması II', 4, 4, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Seçmeli: Alman Felsefesi', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid, 'Seçmeli: Çağdaş Alman Şiiri', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '90e1bfb5-b742-41ad-b949-c12874b99bd0'::uuid LIMIT 1
);

-- === Arka Yuz Yazilim Gelistirme (arka-yuz-yazilim-gelistirme) — 27 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Programlamaya Giriş', 5, 4, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Bilgisayar Mimarisi', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Matematik for Yazılımcılar', 4, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Veritabanı Yönetim Sistemleri', 4, 3, 0.3, 0.2, 0.1, 0.4, 1, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'İşletim Sistemleri', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Nesne Tabanlı Programlama', 5, 4, 0.3, 0.2, 0.1, 0.4, 2, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Veri Yapıları ve Algoritmalar', 5, 4, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'İlişkisel Veritabanı Tasarımı', 4, 3, 0.3, 0.3, 0, 0.4, 2, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Web Programlama I', 4, 3, 0.2, 0.2, 0.3, 0.3, 2, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Bilgisayar Ağları', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Backend Framework I (Node.js)', 5, 4, 0.2, 0.2, 0.3, 0.3, 3, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'RESTful API Tasarımı', 4, 3, 0.2, 0.3, 0.2, 0.3, 3, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'SQL ve NoSQL Veritabanları', 4, 3, 0.3, 0.3, 0, 0.4, 3, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Git ve Sürüm Kontrol', 3, 3, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Yazılım Mühendisliği İlkeleri', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Bulut Bilişim Temelleri', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Backend Framework II', 5, 4, 0.2, 0.2, 0.3, 0.3, 4, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Mikroservis Mimarisi', 4, 3, 0.2, 0.2, 0.3, 0.3, 4, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'DevOps ve CI/CD', 4, 3, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Güvenli Yazılım Geliştirme', 4, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Bitirme Projesi', 5, 5, 0, 0.3, 0.5, 0.2, 4, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Staj', 4, 0, 0, 0.5, 0.3, 0.2, 4, NULL),
  ('17d76800-d904-468f-9c0e-b435fe3daa25'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 4, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '17d76800-d904-468f-9c0e-b435fe3daa25'::uuid LIMIT 1
);

-- === Arkeoloji (arkeoloji) — 46 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Arkeolojiye Giriş', 4, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Prehistorya I (Paleolitik-Neolitik)', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Klasik Arkeolojiye Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Eskiçağ Tarihi I', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Antik Coğrafya', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Prehistorya II (Kalkolitik)', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Anadolu Arkeolojisi I', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Yunan Arkeolojisi', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Eskiçağ Tarihi II', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Mitoloji', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Anadolu Arkeolojisi II', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Roma Arkeolojisi', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Klasik Diller I (Latince)', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Antik Sanat Tarihi', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Arkeolojik Çizim', 3, 3, 0.2, 0.3, 0.2, 0.3, 3, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Epigrafi I', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Anadolu Arkeolojisi III', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Bizans Arkeolojisi', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Klasik Diller II (Latince)', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Numismatik', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Antik Kentler', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Arkeometri', 3, 3, 0.3, 0.2, 0.1, 0.4, 4, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'İslam Arkeolojisi', 4, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Türk Arkeolojisi', 4, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Klasik Diller III (Eski Yunanca)', 3, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Arkeoloji ve Müzecilik', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Kazı Tekniği', 3, 3, 0.2, 0.3, 0.3, 0.2, 5, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Antik Anıtlar', 3, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Anadolu Uygarlıkları', 4, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Klasik Diller IV (Eski Yunanca)', 3, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Arkeolojik Araştırma Yöntemleri', 3, 3, 0.3, 0.3, 0.1, 0.3, 6, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Koruma ve Restorasyon', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Antik Portre ve Heykel', 3, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Topluma Hizmet', 2, 2, 0, 0.5, 0.3, 0.2, 6, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Bitirme Çalışması I', 5, 5, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Alan Seçmeleri I', 4, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Arkeolojide Bilgisayar Uygulamaları', 3, 3, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Kültürel Miras Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Bitirme Çalışması II', 5, 5, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Alan Seçmeleri II', 4, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Staj', 5, 0, 0, 0.5, 0.3, 0.2, 8, NULL),
  ('a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = 'a2034d76-1b5d-4bb4-870f-d5e35b4aa449'::uuid LIMIT 1
);

-- === Ascilik (ascilik) — 26 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Mutfak Kültürü ve Tarihi', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Temel Mutfak Teknikleri I', 5, 6, 0.3, 0.2, 0.2, 0.3, 1, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Gıda Güvenliği ve Hijyen', 4, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Türk Mutfağı I', 4, 5, 0.3, 0.2, 0.2, 0.3, 1, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Mutfak Matematiği', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Temel Mutfak Teknikleri II', 5, 6, 0.3, 0.2, 0.2, 0.3, 2, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Türk Mutfağı II', 4, 5, 0.3, 0.2, 0.2, 0.3, 2, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Hamur İşleri ve Unlu Mamuller', 4, 5, 0.2, 0.2, 0.3, 0.3, 2, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Çorba ve Soslar', 3, 4, 0.3, 0.2, 0.2, 0.3, 2, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Avrupa Mutfağı I', 5, 6, 0.3, 0.2, 0.2, 0.3, 3, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Et ve Balık Hazırlama', 4, 5, 0.3, 0.2, 0.2, 0.3, 3, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Tatlı ve Pastacılık I', 4, 5, 0.2, 0.2, 0.3, 0.3, 3, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Mutfak Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'İçecek Bilgisi', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Maliyet Kontrolü', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Avrupa Mutfağı II', 5, 6, 0.3, 0.2, 0.2, 0.3, 4, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Dünya Mutfağı', 4, 5, 0.3, 0.2, 0.2, 0.3, 4, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Tatlı ve Pastacılık II', 4, 5, 0.2, 0.2, 0.3, 0.3, 4, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Meniü Planlama', 3, 3, 0.3, 0.3, 0.1, 0.3, 4, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Restoran Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Staj', 4, 0, 0, 0.5, 0.3, 0.2, 4, NULL),
  ('a111f867-ff06-458e-a621-d863ac177f79'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 4, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = 'a111f867-ff06-458e-a621-d863ac177f79'::uuid LIMIT 1
);

-- === Bankacilik Ve Finans (bankacilik-ve-finans) — 44 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'İktisada Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'İşletme İlkeleri', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Muhasebeye Giriş', 4, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Hukuk Başlangıcı', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Matematik I', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Makro İktisat', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Finansal Matematik', 4, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Genel Muhasebe', 4, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Medeni Hukuk', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'İstatistik I', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Para ve Bankacılık', 5, 4, 0.4, 0, 0, 0.6, 3, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Ticaret Hukuku', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Mali Tablolar Analizi', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'İşletme Finansı', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Banka Hukuku', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Muhasebe Uygulamaları', 3, 3, 0.3, 0.3, 0, 0.4, 3, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Bankacılık İşlemleri', 5, 4, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Kredi Yönetimi', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Ticari Bankacılık', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Finansal Yönetim', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Vergi Hukuku', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Ulusal ve Uluslararası Finans', 5, 4, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Risk Yönetimi', 4, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Bankacılıkta Bilgi Sistemleri', 4, 3, 0.3, 0.2, 0.1, 0.4, 5, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Yatırım Analizi', 4, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Türev Ürünler', 3, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Uluslararası Bankacılık', 5, 4, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Finansal Piyasalar', 4, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Merkez Bankacılığı', 4, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Fintech ve Dijital Bankacılık', 4, 3, 0.3, 0.2, 0.1, 0.4, 6, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Mali Suçlar ve KYC', 3, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Kurumsal Finans', 5, 4, 0.4, 0.1, 0, 0.5, 7, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Sermaye Piyasası', 4, 3, 0.4, 0.1, 0, 0.5, 7, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Bitirme Çalışması I', 4, 4, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Staj', 4, 0, 0, 0.5, 0.3, 0.2, 7, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Seçmeli: Davranışsal Finans', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Bankacılık Stratejisi', 5, 4, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Bitirme Çalışması II', 5, 5, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Müşteri İlişkileri Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '7cb13135-0c6d-4d5a-b3b7-06bb56b7ed05'::uuid LIMIT 1
);

-- === Beslenme Ve Diyetetik (beslenme-ve-diyetetik) — 44 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Anatomi I', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Fizyoloji I', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Genel Beslenme I', 4, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Besin Kimyası', 3, 3, 0.4, 0.2, 0, 0.4, 1, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Genel Biyokimya I', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Anatomi II', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Fizyoloji II', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Genel Beslenme II', 4, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Besin Mikrobiyolojisi', 3, 3, 0.4, 0.2, 0, 0.4, 2, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Genel Biyokimya II', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Beslenme Biyokimyası', 5, 4, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Tıbbi Beslenme I', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Toplu Beslenme Sistemleri I', 4, 3, 0.3, 0.3, 0, 0.4, 3, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Besin Hijyeni ve Sanitasyon', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Halk Sağlığı', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'İstatistik', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Tıbbi Beslenme II', 5, 4, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Toplu Beslenme Sistemleri II', 4, 3, 0.3, 0.3, 0, 0.4, 4, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Diyet Tedavisi I', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Anne ve Çocuk Beslenmesi', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Bireysel Beslenme Danışmanlığı', 3, 3, 0.3, 0.3, 0.1, 0.3, 4, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Diyet Tedavisi II', 5, 4, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Sporcu Beslenmesi', 4, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Ergonomi ve Mutfak Planlama', 3, 3, 0.3, 0.3, 0, 0.4, 5, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Besin Analiz Yöntemleri', 3, 3, 0.3, 0.4, 0, 0.3, 5, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Beslenme Eğitimi', 3, 3, 0.3, 0.3, 0.1, 0.3, 5, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Diyet Tedavisi III', 5, 4, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Geriatrik Beslenme', 4, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Enteral ve Parenteral Beslenme', 4, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Toplum Beslenmesi', 3, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Beslenme Epidemiyolojisi', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Klinik Diyetetik Uygulaması I', 5, 5, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'İleri Diyet Tedavisi', 4, 3, 0.4, 0.1, 0, 0.5, 7, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Fonksiyonel Beslenme', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Araştırma Yöntemleri', 3, 3, 0.3, 0.4, 0.1, 0.2, 7, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Bitirme Çalışması I', 3, 3, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Klinik Diyetetik Uygulaması II', 6, 6, 0.2, 0.3, 0.3, 0.2, 8, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Bitirme Çalışması II', 4, 4, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Beslenme Politikaları', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '3bdceb33-10aa-4424-8946-91a6e3ca78ef'::uuid LIMIT 1
);

-- === Bilgisayar Ve Ogretim Teknolojileri (bilgisayar-ve-ogretim-teknolojileri) — 41 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Bilgisayar Donanımı', 4, 3, 0.4, 0.1, 0.1, 0.4, 1, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Programlamaya Giriş', 4, 3, 0.4, 0.1, 0.1, 0.4, 1, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Eğitim Bilimine Giriş', 3, 3, 0.4, 0.2, 0, 0.4, 1, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Bilgisayar Ağları Temelleri', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'İşletim Sistemleri', 4, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Web Tasarımı', 4, 3, 0.2, 0.2, 0.3, 0.3, 2, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Gelişim ve Öğrenme', 3, 3, 0.4, 0.2, 0, 0.4, 2, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Veritabanı Yönetim Sistemleri', 3, 3, 0.3, 0.2, 0.1, 0.4, 2, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Öğretim Teknolojileri', 4, 3, 0.3, 0.2, 0.2, 0.3, 3, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Web Programlama', 4, 3, 0.2, 0.2, 0.3, 0.3, 3, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Öğretim Desenleri', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Nesne Tabanlı Programlama', 4, 3, 0.3, 0.2, 0.2, 0.3, 3, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Ölçme ve Değerlendirme', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Sınıf Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Multimedia Tasarımı', 4, 3, 0.2, 0.2, 0.3, 0.3, 4, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Mobil Programlama', 4, 3, 0.2, 0.2, 0.3, 0.3, 4, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Özel Öğretim Yöntemleri I', 4, 3, 0.3, 0.2, 0.2, 0.3, 4, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Rehberlik', 3, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Eğitim Yazılımı Tasarımı', 3, 3, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'E-Öğrenme Sistemleri', 4, 3, 0.3, 0.2, 0.2, 0.3, 5, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Ağ Güvenliği', 4, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Özel Öğretim Yöntemleri II', 4, 3, 0.3, 0.2, 0.2, 0.3, 5, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Yapay Zekaya Giriş', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Eğitimde Araştırma Yöntemleri', 3, 3, 0.4, 0.3, 0, 0.3, 5, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Eğitimde Mobil Uygulamalar', 4, 3, 0.2, 0.2, 0.3, 0.3, 6, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Oyunlaştırma ve Eğitim', 4, 3, 0.2, 0.2, 0.3, 0.3, 6, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Veri Madenciliği', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Topluma Hizmet', 2, 2, 0, 0.5, 0.3, 0.2, 6, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Seçmeli: Bulut Bilişim', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Öğretmenlik Uygulaması I', 5, 5, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Bitirme Çalışması I', 4, 4, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Eğitimde Proje Yönetimi', 3, 3, 0.3, 0.3, 0.2, 0.2, 7, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Seçmeli: Cybersecurity', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Öğretmenlik Uygulaması II', 5, 5, 0.2, 0.3, 0.3, 0.2, 8, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Bitirme Çalışması II', 5, 5, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid, 'Seçmeli: IoT in Education', 3, 3, 0.3, 0.2, 0.3, 0.2, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '974d11be-0b9b-4b84-ae9a-18b9432c7e39'::uuid LIMIT 1
);

-- === Ofis Yonetimi Ve Sekreterlik (ofis-yonetimi-ve-sekreterlik) — 26 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'Yöneticilik ve Sekreterlik Mesleğine Giriş', 4, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'Büro Makineleri ve Donanımı', 3, 3, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'İletişim Bilgisi', 3, 3, 0.4, 0.2, 0, 0.4, 1, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'Hızlı Klavye Kullanımı I', 3, 4, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'İşletme Bilgisi', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'Büro Yönetimi', 4, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'Mesleki Yazışma Teknikleri', 4, 3, 0.3, 0.3, 0, 0.4, 2, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'Ofis Programları I (Word)', 3, 4, 0.2, 0.3, 0.3, 0.2, 2, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'Hızlı Klavye Kullanımı II', 3, 4, 0.3, 0.3, 0.1, 0.3, 2, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'İnsan İlişkileri', 3, 3, 0.4, 0.2, 0, 0.4, 2, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'Ofis Programları II (Excel)', 4, 4, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'Sunum Teknikleri (PowerPoint)', 3, 4, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'Dosyalama ve Arşivleme', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'Yönetici Asistanlığı Uygulamaları', 3, 3, 0.3, 0.3, 0.1, 0.3, 3, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'Ticari Yazışmalar', 3, 3, 0.3, 0.4, 0, 0.3, 3, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'Toplantı ve Organizasyon', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'İleri Ofis Uygulamaları', 4, 4, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'E-Sekreterlik ve Dijital İletişim', 3, 3, 0.3, 0.3, 0.1, 0.3, 4, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'Halkla İlişkiler', 3, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'Müşteri İlişkileri', 3, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'Staj', 4, 0, 0, 0.5, 0.3, 0.2, 4, NULL),
  ('6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 4, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '6fa78b7a-f9b8-4b87-ad2b-2758f928357d'::uuid LIMIT 1
);

-- === Buyuk Veri Analistligi (buyuk-veri-analistligi) — 26 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'Programlamaya Giriş (Python)', 5, 4, 0.3, 0.2, 0.1, 0.4, 1, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'İstatistiğe Giriş', 4, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'Veritabanı Yönetim Sistemleri', 4, 3, 0.3, 0.2, 0.1, 0.4, 1, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'Veri Yapıları ve Algoritmalar', 4, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'Matematik for Veri Bilimi', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'İleri Python Programlama', 5, 4, 0.2, 0.2, 0.2, 0.4, 2, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'Olasılık ve İstatistik', 4, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'SQL ve İlişkisel Veritabanları', 4, 3, 0.3, 0.3, 0, 0.4, 2, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'Veri Görselleştirme', 4, 3, 0.2, 0.3, 0.3, 0.2, 2, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'İşletim Sistemleri (Linux)', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'Büyük Veri Mimarisi (Hadoop)', 5, 4, 0.3, 0.2, 0.2, 0.3, 3, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'Spark ve Dağıtık İşleme', 4, 3, 0.2, 0.2, 0.3, 0.3, 3, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'NoSQL Veritabanları (MongoDB)', 4, 3, 0.2, 0.3, 0.2, 0.3, 3, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'Veri Madenciliğine Giriş', 4, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'Makine Öğrenmesi Temelleri', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'Veri Hazırlama ve Temizleme', 3, 3, 0.2, 0.4, 0.1, 0.3, 3, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'İleri Veri Madenciliği', 5, 4, 0.3, 0.2, 0.2, 0.3, 4, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'Bulut Bilişim ve Veri Depolama', 4, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'Veri Akış İşleme (Kafka)', 4, 3, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'Bitirme Projesi', 5, 5, 0, 0.3, 0.5, 0.2, 4, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'Staj', 4, 0, 0, 0.5, 0.3, 0.2, 4, NULL),
  ('6faa3e83-de14-404f-bf06-e922db094ed7'::uuid, 'Meslek Etiği ve Veri Gizliliği', 2, 2, 0.4, 0.2, 0, 0.4, 4, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '6faa3e83-de14-404f-bf06-e922db094ed7'::uuid LIMIT 1
);

-- === Calisma Ekonomisi Ve Endustri Iliskileri (calisma-ekonomisi-ve-endustri-iliskileri) — 41 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'İktisada Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Hukuk Başlangıcı', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Sosyoloji', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'İşletme İlkeleri', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Makro İktisat', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Anayasa Hukuku', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Çalışma Ekonomisi', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'İstatistik I', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'İş Hukuku I', 5, 4, 0.4, 0, 0, 0.6, 3, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Endüstri İlişkileri', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Sosyal Politika', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'İş ve Sosyal Güvenlik Hukuku', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'İnsan Kaynakları Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'İş Hukuku II', 5, 4, 0.4, 0, 0, 0.6, 4, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Toplu İş İlişkileri', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Sosyal Güvenlik Hukuku', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Ücret Sistemleri', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Çalışma Sosyolojisi', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'İş ve Meslek Analizi', 5, 4, 0.3, 0.3, 0, 0.4, 5, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Uluslararası Çalışma İlişkileri', 4, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Endüstriyel Demokrasi', 4, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'İş Sağlığı ve Güvenliği', 3, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Çalışma Psikolojisi', 3, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Sendikacılık Tarihi', 5, 4, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Türk Çalışma İlişkileri Sistemi', 4, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'İstihdam Politikaları', 4, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Verimlilik Yönetimi', 3, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Seçmeli: AB Sosyal Politikası', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'İleri İş Hukuku', 5, 4, 0.4, 0.1, 0, 0.5, 7, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Grev ve Lokavt Hukuku', 4, 3, 0.4, 0, 0, 0.6, 7, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Bitirme Çalışması I', 4, 4, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Staj', 4, 0, 0, 0.5, 0.3, 0.2, 7, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Seçmeli: Dijital Çalışma Hayatı', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Karşılaştırmalı Çalışma Sistemleri', 5, 4, 0.4, 0.1, 0, 0.5, 8, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Bitirme Çalışması II', 5, 5, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid, 'Seçmeli: Çalışma Ekonomisinde Güncel Konular', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '3c1e778a-5054-4ec8-bfde-4786f95137f7'::uuid LIMIT 1
);

-- === Cizgi Film Ve Animasyon (cizgi-film-ve-animasyon) — 43 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Çizim Temelleri I', 4, 5, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Sanat Tarihi I', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Anatomi Çizimi', 3, 4, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Animasyona Giriş', 4, 4, 0.4, 0.1, 0.1, 0.4, 1, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Dijital Çizim I', 3, 4, 0.2, 0.3, 0.3, 0.2, 1, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Çizim Temelleri II', 4, 5, 0.3, 0.3, 0.1, 0.3, 2, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Sanat Tarihi II', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Perspektif ve Kompozisyon', 3, 4, 0.3, 0.3, 0.1, 0.3, 2, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, '2D Animasyon I', 4, 5, 0.2, 0.2, 0.3, 0.3, 2, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Dijital Çizim II', 3, 4, 0.2, 0.3, 0.3, 0.2, 2, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Karakter Tasarımı', 4, 5, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, '2D Animasyon II', 4, 5, 0.2, 0.2, 0.3, 0.3, 3, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Storyboard Tasarımı', 3, 4, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Sinema Dili ve Anlatım', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, '3D Modelleme I', 3, 4, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Renk Teorisi', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, '3D Animasyon I', 4, 5, 0.2, 0.2, 0.3, 0.3, 4, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, '3D Modelleme II', 4, 5, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Hareket Analizi', 3, 4, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Senaryo Yazarlığı', 3, 3, 0.3, 0.4, 0, 0.3, 4, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'VFX Compositing I', 3, 4, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, '3D Animasyon II', 4, 5, 0.2, 0.2, 0.3, 0.3, 5, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Karakter Animasyonu', 4, 5, 0.2, 0.2, 0.3, 0.3, 5, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Çevre Tasarımı', 3, 4, 0.2, 0.3, 0.3, 0.2, 5, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Animasyon Tarihi', 3, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Ses Tasarımı', 3, 4, 0.2, 0.3, 0.3, 0.2, 5, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Stop-Motion Animasyon', 4, 5, 0.2, 0.2, 0.3, 0.3, 6, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Motion Graphics', 4, 5, 0.2, 0.2, 0.3, 0.3, 6, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'VFX Compositing II', 3, 4, 0.2, 0.2, 0.4, 0.2, 6, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Yönetmenlik Sanatı', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Staj', 3, 0, 0, 0.5, 0.3, 0.2, 6, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Bitirme Projesi I', 5, 6, 0, 0.3, 0.5, 0.2, 7, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'İleri Karakter Animasyonu', 4, 5, 0.2, 0.2, 0.3, 0.3, 7, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Animasyon Prodüksiyon', 3, 3, 0.4, 0.3, 0, 0.3, 7, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Seçmeli: Oyun Animasyonu', 3, 4, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Bitirme Projesi II', 6, 8, 0, 0.3, 0.5, 0.2, 8, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Portföy Hazırlama', 3, 3, 0.2, 0.4, 0.2, 0.2, 8, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid, 'Seçmeli: VR/AR Animasyon', 3, 4, 0.2, 0.3, 0.3, 0.2, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '45bdb622-9e0a-456a-ada5-a05316659f9b'::uuid LIMIT 1
);

-- === Cocuk Gelisimi (cocuk-gelisimi) — 26 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Çocuk Gelişimine Giriş', 4, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Çocuk Sağlığı ve Hastalıkları', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Anatomi ve Fizyoloji', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Çocuk Psikolojisi', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Gelişim Psikolojisi I', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Gelişim Psikolojisi II', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Çocuk Edebiyatı', 3, 3, 0.4, 0.2, 0, 0.4, 2, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Çocuk Beslenmesi', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Oyun ve Oyun Ortamı', 3, 4, 0.3, 0.3, 0.1, 0.3, 2, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Özel Eğitime Giriş', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Bilişsel Gelişim', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Dil Gelişimi', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Sosyal Duygusal Gelişim', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Motor Gelişim', 3, 3, 0.3, 0.2, 0.1, 0.4, 3, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Çocuk Hakları', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'İletişim Becerileri', 3, 3, 0.3, 0.3, 0, 0.4, 3, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Çocuk Gözlemi ve Değerlendirme', 4, 4, 0.2, 0.3, 0.2, 0.3, 4, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Çocuğu Koruyucu Aile Danışmanlığı', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Özel Gelişim Destek Programları', 3, 3, 0.3, 0.3, 0.1, 0.3, 4, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Çocuk Müziği ve Drama', 3, 3, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Staj', 4, 0, 0, 0.5, 0.3, 0.2, 4, NULL),
  ('a50154fb-087a-4c32-a89c-6e87164dde18'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 4, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = 'a50154fb-087a-4c32-a89c-6e87164dde18'::uuid LIMIT 1
);

-- === Dijital Oyun Tasarimi (dijital-oyun-tasarimi) — 42 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Oyun Tasarımına Giriş', 4, 3, 0.4, 0.1, 0.1, 0.4, 1, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Programlamaya Giriş', 4, 3, 0.4, 0.1, 0.1, 0.4, 1, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Çizim Temelleri', 3, 4, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Dijital Grafik', 3, 4, 0.2, 0.3, 0.3, 0.2, 1, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Oyun Endüstrisi Tarihi', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Oyun Programlama I (Unity)', 4, 4, 0.2, 0.2, 0.3, 0.3, 2, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Oyun Seviye Tasarımı', 3, 4, 0.2, 0.2, 0.4, 0.2, 2, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, '3D Modelleme I', 3, 4, 0.2, 0.3, 0.3, 0.2, 2, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Oyun Hikayesi ve Senaryo', 3, 3, 0.4, 0.2, 0, 0.4, 2, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Matematik for Oyunlar', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Oyun Programlama II', 4, 4, 0.2, 0.2, 0.3, 0.3, 3, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, '3D Modelleme II', 3, 4, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Karakter Tasarımı', 3, 4, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Oyun Fizik ve Yapay Zeka', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Oyun Ses Tasarımı', 3, 3, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'UX/UI for Oyunlar', 3, 3, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Çok Oyunculu Oyun Programlama', 4, 4, 0.2, 0.2, 0.3, 0.3, 4, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Mobil Oyun Geliştirme', 4, 4, 0.2, 0.2, 0.3, 0.3, 4, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Oyun Test ve Optimizasyon', 3, 3, 0.3, 0.3, 0.2, 0.2, 4, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Oyun Animasyonu', 3, 4, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Bitirme Projesi I', 3, 5, 0, 0.3, 0.5, 0.2, 4, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'İleri Oyun Programlama (Unreal)', 4, 4, 0.2, 0.2, 0.3, 0.3, 5, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'VR/AR Oyun Geliştirme', 3, 4, 0.2, 0.2, 0.4, 0.2, 5, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Oyun Ekonomisi ve Monetization', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Oyun Pazarlama ve Yayınlama', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Proje Yönetimi', 3, 3, 0.4, 0.3, 0, 0.3, 5, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Bitirme Projesi II', 5, 8, 0, 0.3, 0.5, 0.2, 6, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Oyun Endüstrisi ve Hukuk', 3, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Seçmeli: Battle Royale Geliştirme', 3, 4, 0.2, 0.2, 0.4, 0.2, 6, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Seçmeli: Oyun Veri Analizi', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Oyun Şirketi Stajı', 5, 0, 0, 0.5, 0.3, 0.2, 7, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'İleri 3D Animasyon', 3, 4, 0.2, 0.2, 0.4, 0.2, 7, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Oyun Yazılım Mimarisi', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Seçmeli: İndie Oyun Geliştirme', 3, 4, 0.2, 0.2, 0.4, 0.2, 7, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Bitirme Projesi III', 6, 10, 0, 0.3, 0.5, 0.2, 8, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Portföy Hazırlama', 3, 3, 0.2, 0.4, 0.2, 0.2, 8, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid, 'Oyun Girişimciliği', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = 'c405a12b-236d-4f7e-afe7-a4e9f6b18ef1'::uuid LIMIT 1
);

-- === Dil Ve Konusma Terapisi (dil-ve-konusma-terapisi) — 42 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Anatomi I', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Fizyoloji I', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Dilbilim Temelleri', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Ses Fizyolojisi', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Genel Psikoloji', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Anatomi II', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Fizyoloji II', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Sesbilim', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Çocuk Dili Edinimi', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Nöroanatomi', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Dil ve Konuşma Bozukluklarına Giriş', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Ses Bozuklukları', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Artikülasyon Bozuklukları', 4, 3, 0.3, 0.2, 0.1, 0.4, 3, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Klinik fonetik', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Nörolojik Temeller', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Gelişim Psikolojisi', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Afazi ve İlgili Bozukluklar', 5, 4, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Dil Gelişim Bozuklukları', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Konuşma Akışı Bozuklukları (Kekemelik)', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Yutma Bozuklukları (Disfaji)', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Ölçme ve Değerlendirme', 3, 3, 0.3, 0.3, 0, 0.4, 4, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Çocuk Dilinde Klinik Uygulama', 5, 4, 0.2, 0.2, 0.3, 0.3, 5, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Erken Müdahale', 4, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'İşitme ve Konuşma', 4, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Kulak Burun Boğaz Hastalıkları', 3, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Aile Danışmanlığı', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Erişkin Dilinde Klinik Uygulama', 5, 4, 0.2, 0.2, 0.3, 0.3, 6, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Alternatif ve Destekleyici İletişim', 4, 3, 0.3, 0.2, 0.2, 0.3, 6, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Ses Sağlığı ve Korunması', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Araştırma Yöntemleri', 3, 3, 0.3, 0.4, 0.1, 0.2, 6, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Bitirme Çalışması I', 3, 3, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Klinik Staj I', 6, 6, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'İleri Klinik Değerlendirme', 4, 3, 0.3, 0.3, 0.2, 0.2, 7, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Multidisipliner Yaklaşım', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Bitirme Çalışması II', 3, 3, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Klinik Staj II', 8, 8, 0.2, 0.3, 0.3, 0.2, 8, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Bitirme Çalışması III', 4, 4, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = 'e658bb8c-964f-40d7-8cd8-fdda9d8c3f6c'::uuid LIMIT 1
);

-- === Eczacilik (eczacilik) — 44 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Anatomi', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Fizyoloji', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Genel Kimya', 4, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Organik Kimya', 4, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Biyokimya I', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Hücre Biyolojisi', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Mikrobiyoloji', 4, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Analitik Kimya', 4, 3, 0.4, 0.2, 0, 0.4, 2, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Biyokimya II', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Farmasötik Botanik', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Farmakoloji I', 5, 4, 0.4, 0, 0, 0.6, 3, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Farmasötik Kimya I', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Farmasötik Teknoloji I', 4, 3, 0.3, 0.2, 0.1, 0.4, 3, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Patoloji', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Farmakognozi I', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'İmmünoloji', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Farmakoloji II', 5, 4, 0.4, 0, 0, 0.6, 4, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Farmasötik Kimya II', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Farmasötik Teknoloji II', 4, 3, 0.3, 0.2, 0.1, 0.4, 4, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Farmakognozi II', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Toksikoloji', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Klinik Farmakoloji I', 5, 4, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Farmasötik Care I', 4, 3, 0.3, 0.2, 0.2, 0.3, 5, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Reçete Bilgisi', 4, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Biyoistatistik', 3, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Eczacılık Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Klinik Farmakoloji II', 5, 4, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Farmasötik Care II', 4, 3, 0.3, 0.2, 0.2, 0.3, 6, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Fitoterapi', 3, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Kozmetik Eczacılık', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Halk Sağlığı ve Epidemiyoloji', 3, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Klinik Eczacılık Stajı I', 6, 6, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'İlaç Etkileşimleri', 4, 3, 0.4, 0.1, 0, 0.5, 7, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Radyofarmasi', 3, 3, 0.4, 0.1, 0, 0.5, 7, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Biyoteknoloji ve Gen Terapisi', 3, 3, 0.4, 0.1, 0, 0.5, 7, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Seçmeli: Nükleer Eczacılık', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Klinik Eczacılık Stajı II', 8, 8, 0.2, 0.3, 0.3, 0.2, 8, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Mezuniyet Projesi', 4, 4, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Eczacılık Etik ve Hukuk', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('6623f593-a345-4851-990f-350903c43682'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '6623f593-a345-4851-990f-350903c43682'::uuid LIMIT 1
);

-- === Eczane Hizmetleri (eczane-hizmetleri) — 26 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Anatomi ve Fizyoloji', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Genel Kimya', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Farmasötik Botaniğe Giriş', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Eczacılık Mesleğine Giriş', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Bilgisayar Kullanımı', 3, 3, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Farmakolojiye Giriş', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'İlaç Tanıtımı ve Sınıflandırması', 4, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Eczane Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 2, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Reçete Okuma ve Hazırlama', 3, 3, 0.3, 0.3, 0, 0.4, 2, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'İlk Yardım', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Reçeteli İlaç Bilgisi I', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Hastalık Bilgisi I', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Farmasötik Teknoloji', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Eczane Uygulamaları I', 3, 4, 0.2, 0.3, 0.2, 0.3, 3, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Sosyal Güvenlik ve SGK Uygulamaları', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'İletişim Becerileri', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Reçeteli İlaç Bilgisi II', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Hastalık Bilgisi II', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Eczane Uygulamaları II', 3, 4, 0.2, 0.3, 0.2, 0.3, 4, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Bitkisel İlaçlar ve Fitoterapi', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Staj', 4, 0, 0, 0.5, 0.3, 0.2, 4, NULL),
  ('5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 4, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '5a92e5bc-ee20-4735-ae46-d354d03595e3'::uuid LIMIT 1
);

-- === Emlak Yonetimi (emlak-yonetimi) — 26 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Emlak Yönetimine Giriş', 4, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'İnşaat Malzemeleri', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Yapı Bilgisi', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'İşletme İlkeleri', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Hukuk Başlangıcı', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Emlak Hukuku', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Emlak Pazarlama', 3, 3, 0.4, 0.2, 0, 0.4, 2, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Emlak Değerleme', 4, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Ticari Hukuk', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Mimarlık ve Şehircilik Tarihi', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Gayrimenkul Finansmanı', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Konut ve İşyeri Yönetimi', 4, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Emlak Vergi Mevzuatı', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Proje Okuma ve Anlama', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Tapu ve Kadastro', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Müşteri İlişkileri Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'İleri Emlak Değerleme', 4, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Parselasyon ve Arsa Geliştirme', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Emlak Sektöründe Bilgi Sistemleri', 3, 3, 0.3, 0.3, 0.1, 0.3, 4, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Emlak Sigortacılığı', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Staj', 4, 0, 0, 0.5, 0.3, 0.2, 4, NULL),
  ('d0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 4, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = 'd0aa1bbd-94c1-4fcd-b964-6bf4990abb50'::uuid LIMIT 1
);

-- === Felsefe (felsefe) — 40 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Felsefeye Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Antik Felsefe I', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Mantık I', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Sosyoloji', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Antik Felsefe II', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Ortaçağ Felsefesi', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Mantık II', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Psikoloji', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Yeniçağ Felsefesi', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Bilgi Felsefesi', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Etik', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Varlık Felsefesi', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'İslam Felsefesi I', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Yakınçağ Felsefesi', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Siyaset Felsefesi', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Bilim Felsefesi', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Sanat Felsefesi', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'İslam Felsefesi II', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, '20. Yüzyıl Felsefesi I', 5, 4, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Türk Düşünce Tarihi I', 4, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Felsefe Seminerleri I', 3, 3, 0.2, 0.4, 0.2, 0.2, 5, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Estetik', 3, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Din Felsefesi', 3, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, '20. Yüzyıl Felsefesi II', 5, 4, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Türk Düşünce Tarihi II', 4, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Çağdaş Felsefe Akımları', 3, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Felsefe Seminerleri II', 3, 3, 0.2, 0.4, 0.2, 0.2, 6, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Kültür Felsefesi', 3, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Bitirme Çalışması I', 5, 5, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Çağdaş Etik Sorunları', 4, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Mantık Felsefesi', 3, 3, 0.4, 0.1, 0, 0.5, 7, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Seçmeli: Sinema ve Felsefe', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Bitirme Çalışması II', 6, 6, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Seçmeli: Felsefe ve Edebiyat', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid, 'Seçmeli: Postmodern Felsefe', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '96ef9627-4ad1-4c72-b4c6-ea030298e08d'::uuid LIMIT 1
);

-- === Fransizca Ogretmenligi (fransizca-ogretmenligi) — 44 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Fransızca Dilbilgisi I', 4, 4, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Fransızca Okuma I', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Fransızca Yazma I', 3, 3, 0.3, 0.3, 0, 0.4, 1, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Fransızca Konuşma I', 3, 3, 0.4, 0.1, 0.1, 0.4, 1, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Fransız Edebiyatına Giriş', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Fransızca Dilbilgisi II', 4, 4, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Fransızca Okuma II', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Fransızca Yazma II', 3, 3, 0.3, 0.3, 0, 0.4, 2, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Fransızca Konuşma II', 3, 3, 0.4, 0.1, 0.1, 0.4, 2, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Fransız Edebiyatı Tarihi', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Fransızca Çeviri I', 4, 4, 0.3, 0.3, 0, 0.4, 3, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Fransız Edebiyatı Klasikleri', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Öğretim İlke ve Yöntemleri', 4, 4, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Fransız Kültürü ve Medeniyeti', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Linguistik I', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Bilgisayar Becerileri', 2, 2, 0.3, 0.3, 0.1, 0.3, 3, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Fransızca Çeviri II', 4, 4, 0.3, 0.3, 0, 0.4, 4, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Çağdaş Fransız Edebiyatı', 3, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Öğretim Teknolojileri', 3, 3, 0.3, 0.3, 0.1, 0.3, 4, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Fransız Sineması', 3, 3, 0.3, 0.2, 0.2, 0.3, 4, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Linguistik II', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Sınıf Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Fransız Edebiyatı Analizi', 4, 4, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Çocuk Edebiyatı', 3, 3, 0.3, 0.3, 0.1, 0.3, 5, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Ölçme ve Değerlendirme', 4, 4, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Özel Öğretim Yöntemleri I', 3, 3, 0.3, 0.3, 0.1, 0.3, 5, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Rehberlik', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Fransız Edebiyatı Semineri', 4, 4, 0.2, 0.3, 0.2, 0.3, 6, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Karşılaştırmalı Edebiyat', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Topluma Hizmet Uygulamaları', 2, 2, 0, 0.5, 0.3, 0.2, 6, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Fransızca İş Fransızcası', 3, 3, 0.3, 0.3, 0, 0.4, 6, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Türk-Fransız Kültürel İlişkileri', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Öğretmenlik Uygulaması I', 5, 5, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Fransız Eğitim Sistemi', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Çeviri Uygulamaları', 3, 3, 0.3, 0.3, 0.1, 0.3, 7, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Bitirme Çalışması I', 3, 3, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Öğretmenlik Uygulaması II', 5, 5, 0.2, 0.3, 0.3, 0.2, 8, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Bitirme Çalışması II', 4, 4, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid, 'Seçmeli: Fransız Felsefesi', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '9a541aa8-998c-467e-9e27-4468e973f2f1'::uuid LIMIT 1
);

-- === Gastronomi Ve Mutfak Sanatlari (gastronomi-ve-mutfak-sanatlari) — 43 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Gastronomi Tarihine Giriş', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Mutfak Sanatları I', 5, 6, 0.2, 0.2, 0.3, 0.3, 1, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Gıda Güvenliği ve Hijyen', 4, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Gıda Bilgisi ve Kimyası', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Türk Mutfağı I', 4, 5, 0.2, 0.2, 0.3, 0.3, 1, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Mutfak Sanatları II', 5, 6, 0.2, 0.2, 0.3, 0.3, 2, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Türk Mutfağı II', 4, 5, 0.2, 0.2, 0.3, 0.3, 2, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Avrupa Mutfağı I', 4, 5, 0.2, 0.2, 0.3, 0.3, 2, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Pastacılık ve Ekmek', 4, 5, 0.2, 0.2, 0.3, 0.3, 2, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'İçecek Bilgisi', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Avrupa Mutfağı II', 5, 6, 0.2, 0.2, 0.3, 0.3, 3, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Asya Mutfağı', 4, 5, 0.2, 0.2, 0.3, 0.3, 3, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Tatlı ve Şekerleme Sanatı', 4, 5, 0.2, 0.2, 0.3, 0.3, 3, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Restoran Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Maliyet Kontrolü ve Satın Alma', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Şarap ve İçecek Eşleştirme', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Otantik Mutfaklar', 4, 5, 0.2, 0.2, 0.3, 0.3, 4, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Yaratıcı Mutfak Sanatları', 5, 6, 0.1, 0.2, 0.4, 0.3, 4, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Moleküler Gastronomi', 3, 4, 0.3, 0.2, 0.3, 0.2, 4, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Menü Planlama ve Tasarımı', 3, 3, 0.3, 0.4, 0, 0.3, 4, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Gıda Fotoğrafçılığı', 3, 3, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Modern Restoran Mutfak Yönetimi', 5, 5, 0.3, 0.2, 0.2, 0.3, 5, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Dünya Şarap Bölgeleri', 4, 4, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Gıda Sosyolojisi ve Antropolojisi', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Mutfak Liderliği ve Ekipler', 3, 3, 0.4, 0.3, 0, 0.3, 5, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'İleri Pastacılık ve Çikolata', 4, 5, 0.1, 0.2, 0.4, 0.3, 5, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Sürdürülebilir Gastronomi', 4, 4, 0.4, 0.3, 0, 0.3, 6, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Şef Restoranı Konsept Tasarımı', 4, 5, 0.2, 0.3, 0.3, 0.2, 6, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Girişimcilik ve İşletme Açma', 3, 3, 0.4, 0.3, 0, 0.3, 6, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Bitirme Projesi I', 4, 6, 0, 0.3, 0.5, 0.2, 6, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Staj', 4, 0, 0, 0.5, 0.3, 0.2, 6, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'İleri Mutfak Sanatları', 5, 6, 0.2, 0.2, 0.3, 0.3, 7, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Michelin Standartları', 3, 4, 0.4, 0.2, 0.1, 0.3, 7, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Gıda Yazarlığı ve Eleştirisi', 3, 3, 0.3, 0.4, 0, 0.3, 7, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Bitirme Projesi II', 4, 6, 0, 0.3, 0.5, 0.2, 7, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Bitirme Projesi III', 6, 10, 0, 0.3, 0.5, 0.2, 8, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Şef Portföyü ve Kişisel Marka', 3, 3, 0.2, 0.4, 0.2, 0.2, 8, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('d2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid, 'Seçmeli: TV Aşçılığı', 3, 3, 0.2, 0.3, 0.3, 0.2, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = 'd2f4a517-d51a-42d7-bb79-650519ed5ed6'::uuid LIMIT 1
);

-- === Gazetecilik (gazetecilik) — 41 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Gazeteciliğe Giriş', 4, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'İletişim Bilimlerine Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Haber Yazma Teknikleri I', 4, 4, 0.3, 0.4, 0, 0.3, 1, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Türk Basın Tarihi', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Sosyoloji', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Haber Yazma Teknikleri II', 4, 4, 0.3, 0.4, 0, 0.3, 2, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Haber Toplama', 4, 4, 0.2, 0.4, 0.2, 0.2, 2, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'İletişim Hukuku', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Fotoğrafçılık', 3, 4, 0.2, 0.2, 0.4, 0.2, 2, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Haber Yazma Uygulamaları', 5, 5, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Dijital Gazetecilik', 4, 4, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Araştırma ve Röportaj Teknikleri', 3, 3, 0.3, 0.3, 0.2, 0.2, 3, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Basın Etik', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Siyasal İletişim', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'İleri Haber Yazma', 5, 5, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Veri Gazeteciliği', 4, 4, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Editörlük', 3, 3, 0.2, 0.5, 0, 0.3, 4, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Mobil Gazetecilik', 3, 3, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Uluslararası İletişim', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Multimedya Haberciliği', 5, 5, 0.2, 0.2, 0.4, 0.2, 5, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Sosyal Medya Haberciliği', 4, 4, 0.2, 0.2, 0.4, 0.2, 5, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Spor Gazeteciliği', 3, 3, 0.3, 0.3, 0.2, 0.2, 5, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Ekonomi Gazeteciliği', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Staj', 3, 0, 0, 0.5, 0.3, 0.2, 5, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'İnceleme Haberciliği', 5, 5, 0.2, 0.3, 0.3, 0.2, 6, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Yaratıcı Yazarlık', 4, 4, 0.2, 0.4, 0.2, 0.2, 6, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Kültür ve Sanat Gazeteciliği', 3, 3, 0.3, 0.3, 0.2, 0.2, 6, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Bilim ve Teknoloji Gazeteciliği', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Bitirme Projesi I', 3, 3, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Yayın Yönetimi', 4, 4, 0.3, 0.3, 0.2, 0.2, 7, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Medya Ekonomisi', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Bitirme Projesi II', 5, 5, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Seçmeli: Görsel Hikaye Anlatımı', 3, 3, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Bitirme Projesi III', 6, 8, 0, 0.3, 0.5, 0.2, 8, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Medya Yönetimi', 3, 3, 0.4, 0.3, 0, 0.3, 8, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid, 'Seçmeli: VR Gazeteciliği', 3, 3, 0.2, 0.3, 0.3, 0.2, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '01cbcad3-7dd2-4daa-8e1c-df02691674e0'::uuid LIMIT 1
);

-- === Gorsel Iletisim Tasarimi (gorsel-iletisim-tasarimi) — 43 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Tasarım Temelleri I', 4, 5, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Temel Sanat Eğitimi', 4, 5, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Tipografi I', 3, 4, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Fotoğraf I', 3, 4, 0.2, 0.2, 0.4, 0.2, 1, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Dijital Tasarım I', 3, 4, 0.2, 0.3, 0.3, 0.2, 1, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Tasarım Temelleri II', 4, 5, 0.3, 0.3, 0.1, 0.3, 2, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Tipografi II', 3, 4, 0.3, 0.3, 0.1, 0.3, 2, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Grafik Tasarım I', 4, 5, 0.2, 0.2, 0.4, 0.2, 2, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'İllüstrasyon I', 3, 4, 0.2, 0.3, 0.3, 0.2, 2, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Dijital Tasarım II', 3, 4, 0.2, 0.3, 0.3, 0.2, 2, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'İleri Grafik Tasarım I', 4, 5, 0.2, 0.2, 0.4, 0.2, 3, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Marka Kimliği Tasarımı', 4, 5, 0.2, 0.2, 0.4, 0.2, 3, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Ambalaj Tasarımı', 3, 4, 0.2, 0.2, 0.4, 0.2, 3, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Web Tasarımı I', 3, 4, 0.2, 0.2, 0.4, 0.2, 3, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Hareketli Grafik I', 3, 4, 0.2, 0.2, 0.4, 0.2, 3, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Sanat Tarihi', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'İleri Grafik Tasarım II', 4, 5, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Reklam Tasarımı', 4, 5, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'UI/UX Tasarımı', 3, 4, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Web Tasarımı II', 3, 4, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Tipografi Uygulamaları', 3, 4, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'İllüstrasyon II', 4, 5, 0.2, 0.3, 0.3, 0.2, 5, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Hareketli Grafik II', 4, 5, 0.2, 0.2, 0.4, 0.2, 5, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Etkileşimli Tasarım', 3, 4, 0.2, 0.3, 0.3, 0.2, 5, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Tasarım Araştırması', 3, 3, 0.4, 0.3, 0, 0.3, 5, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Seçmeli: 3D Modelleme', 3, 4, 0.2, 0.3, 0.3, 0.2, 5, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Tasarım Stüdyosu I', 5, 6, 0.2, 0.2, 0.4, 0.2, 6, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Bitirme Projesi I', 4, 5, 0, 0.3, 0.5, 0.2, 6, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Sürdürülebilir Tasarım', 3, 4, 0.3, 0.3, 0.2, 0.2, 6, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Seçmeli: Tipografi Atölyesi', 3, 4, 0.2, 0.3, 0.3, 0.2, 6, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Seçmeli: Deneysel Tasarım', 3, 4, 0.2, 0.3, 0.3, 0.2, 6, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Tasarım Stüdyosu II', 5, 6, 0.2, 0.2, 0.4, 0.2, 7, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Bitirme Projesi II', 5, 6, 0, 0.3, 0.5, 0.2, 7, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Tasarım Yönetimi', 3, 3, 0.4, 0.3, 0, 0.3, 7, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Seçmeli: Yaratıcı Kodlama', 3, 4, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Bitirme Projesi III', 6, 8, 0, 0.3, 0.5, 0.2, 8, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Portföy Tasarımı', 3, 3, 0.2, 0.4, 0.2, 0.2, 8, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('384062a3-20d8-4f32-a45e-75da229074a5'::uuid, 'Seçmeli: Tasarım Girişimciliği', 3, 3, 0.4, 0.3, 0, 0.3, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '384062a3-20d8-4f32-a45e-75da229074a5'::uuid LIMIT 1
);

-- === Grafik Sanatlar (grafik-sanatlar) — 42 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Temel Sanat Eğitimi I', 4, 5, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Çizim I', 4, 5, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Desen I', 3, 4, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Sanat Tarihi I', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Temel Sanat Eğitimi II', 4, 5, 0.3, 0.3, 0.1, 0.3, 2, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Çizim II', 4, 5, 0.3, 0.3, 0.1, 0.3, 2, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Desen II', 3, 4, 0.3, 0.3, 0.1, 0.3, 2, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Sanat Tarihi II', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Baskı Sanatları I (Litografi)', 4, 5, 0.2, 0.2, 0.4, 0.2, 3, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Dijital Baskı I', 3, 4, 0.2, 0.2, 0.4, 0.2, 3, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Tipografi', 3, 4, 0.3, 0.3, 0.1, 0.3, 3, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Grafik Tasarım I', 3, 4, 0.2, 0.2, 0.4, 0.2, 3, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Anatomi', 3, 4, 0.3, 0.3, 0.1, 0.3, 3, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Perspektif', 3, 4, 0.3, 0.3, 0.1, 0.3, 3, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Baskı Sanatları II (Gravür)', 4, 5, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Serigrafi', 3, 4, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Grafik Tasarım II', 3, 4, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'İllüstrasyon', 3, 4, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Çağdaş Sanat', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Türk Sanatı Tarihi', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'İleri Baskı Sanatları I', 4, 5, 0.2, 0.2, 0.4, 0.2, 5, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Atölye Çalışması I', 4, 5, 0.2, 0.2, 0.4, 0.2, 5, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Deneysel Baskı', 3, 4, 0.2, 0.2, 0.4, 0.2, 5, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Sanat Felsefesi', 3, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Seçmeli: Kitap Sanatı', 3, 4, 0.2, 0.3, 0.3, 0.2, 5, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'İleri Baskı Sanatları II', 4, 5, 0.2, 0.2, 0.4, 0.2, 6, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Atölye Çalışması II', 4, 5, 0.2, 0.2, 0.4, 0.2, 6, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Dijital Grafik', 3, 4, 0.2, 0.2, 0.4, 0.2, 6, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Sanat Eleştirisi', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Bitirme Projesi I', 3, 5, 0, 0.3, 0.5, 0.2, 6, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Bitirme Projesi II', 5, 6, 0, 0.3, 0.5, 0.2, 7, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Sanat Proje Yönetimi', 3, 3, 0.4, 0.3, 0, 0.3, 7, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Müze ve Galeri Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Seçmeli: Heykel ve Baskı', 3, 4, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Bitirme Projesi III', 6, 8, 0, 0.3, 0.5, 0.2, 8, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Portföy ve Sergi Hazırlama', 3, 3, 0.2, 0.4, 0.2, 0.2, 8, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('517293c4-b74b-4031-90f5-74689469e7b9'::uuid, 'Seçmeli: Sanat Girişimciliği', 3, 3, 0.4, 0.3, 0, 0.3, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '517293c4-b74b-4031-90f5-74689469e7b9'::uuid LIMIT 1
);

-- === Halkla Iliskiler Ve Tanitim (halkla-iliskiler-ve-tanitim) — 40 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Halkla İlişkilere Giriş', 4, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'İletişim Bilimlerine Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Sosyoloji', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'İşletme İlkeleri', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Halkla İlişkiler Kuramı', 4, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Reklamcılığa Giriş', 4, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Pazarlama İlkeleri', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Yazılı İletişim', 3, 3, 0.3, 0.4, 0, 0.3, 2, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Kurumsal İletişim', 5, 4, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Bütünleşik Pazarlama İletişimi', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Halkla İlişkiler Kampanyaları', 4, 3, 0.3, 0.3, 0.1, 0.3, 3, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'İletişim Hukuku', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Sosyal Psikoloji', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'İtibar Yönetimi', 5, 4, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Kriz İletişimi', 4, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Dijital Halkla İlişkiler', 4, 3, 0.2, 0.3, 0.2, 0.3, 4, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Tüketici Davranışı', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Medya İlişkileri', 3, 3, 0.3, 0.3, 0.1, 0.3, 4, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Kurumsal Sosyal Sorumluluk', 5, 4, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'İç İletişim', 4, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Etkinlik Yönetimi', 4, 4, 0.2, 0.3, 0.3, 0.2, 5, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Lobi Faaliyetleri', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Sosyal Medya Yönetimi', 3, 3, 0.2, 0.3, 0.3, 0.2, 5, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Halkla İlişkiler Stratejisi', 5, 4, 0.3, 0.3, 0.1, 0.3, 6, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Bitirme Projesi I', 4, 4, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Sürdürülebilirlik İletişimi', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Seçmeli: İnf.luencer İletişimi', 3, 3, 0.3, 0.3, 0.2, 0.2, 6, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Staj', 3, 0, 0, 0.5, 0.3, 0.2, 6, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Halkla İlişkiler Danışmanlığı', 5, 4, 0.3, 0.3, 0.1, 0.3, 7, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Bitirme Projesi II', 5, 5, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Medya Planlama', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Seçmeli: Politik İletişim', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Bitirme Projesi III', 6, 6, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Halkla İlişkilerde Etik', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('d2fc3d5b-177d-44ef-9133-a2b162938367'::uuid, 'Seçmeli: Uluslararası Halkla İlişkiler', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = 'd2fc3d5b-177d-44ef-9133-a2b162938367'::uuid LIMIT 1
);

-- === Heykel (heykel) — 44 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Temel Sanat Eğitimi I', 4, 5, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Modelaj I', 4, 5, 0.3, 0.2, 0.3, 0.2, 1, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Çizim I', 3, 4, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Anatomi', 3, 4, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Sanat Tarihi I', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Temel Sanat Eğitimi II', 4, 5, 0.3, 0.3, 0.1, 0.3, 2, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Modelaj II', 4, 5, 0.3, 0.2, 0.3, 0.2, 2, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Çizim II', 3, 4, 0.3, 0.3, 0.1, 0.3, 2, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Heykel Malzemeleri', 3, 4, 0.4, 0.2, 0.1, 0.3, 2, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Sanat Tarihi II', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Taş Heykel I', 4, 5, 0.2, 0.2, 0.4, 0.2, 3, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Ahşap Heykel I', 4, 5, 0.2, 0.2, 0.4, 0.2, 3, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Metal Heykel I', 3, 4, 0.2, 0.2, 0.4, 0.2, 3, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Heykel Tasarımı', 3, 4, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Çağdaş Heykel', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Perspektif', 3, 4, 0.3, 0.3, 0.1, 0.3, 3, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Taş Heykel II', 4, 5, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Ahşap Heykel II', 4, 5, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Metal Heykel II', 3, 4, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Bronz Döküm', 3, 4, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Seramik Heykel', 3, 4, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Türk Heykel Tarihi', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Atölye I (Seçmeli Malzeme)', 5, 6, 0.2, 0.2, 0.4, 0.2, 5, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Dijital Heykel', 4, 5, 0.2, 0.2, 0.4, 0.2, 5, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Sanat Felsefesi', 3, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, '3D Tasarım ve Modelleme', 3, 4, 0.2, 0.2, 0.4, 0.2, 5, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Sanat Eleştirisi', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Atölye II (Seçmeli Malzeme)', 5, 6, 0.2, 0.2, 0.4, 0.2, 6, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Bitirme Projesi I', 4, 5, 0, 0.3, 0.5, 0.2, 6, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Kamu Heykeli', 3, 4, 0.2, 0.2, 0.4, 0.2, 6, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Çağdaş Sanat Akımları', 3, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Sanat Proje Yönetimi', 3, 3, 0.4, 0.3, 0, 0.3, 6, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Bitirme Projesi II', 5, 6, 0, 0.3, 0.5, 0.2, 7, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Sanat Yönetimi', 3, 3, 0.4, 0.3, 0, 0.3, 7, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Müze ve Galeri Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Seçmeli: Enstalasyon Sanatı', 3, 4, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Bitirme Projesi III', 6, 8, 0, 0.3, 0.5, 0.2, 8, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Portföy ve Sergi Hazırlama', 3, 3, 0.2, 0.4, 0.2, 0.2, 8, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid, 'Seçmeli: Kamu Sanatı Projeleri', 3, 4, 0.2, 0.3, 0.3, 0.2, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '1505fbc4-0922-405b-bb62-f6a12d17b246'::uuid LIMIT 1
);

-- === Hukuk (hukuk) — 42 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Hukuk Başlangıcı', 5, 4, 0.4, 0, 0, 0.6, 1, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Anayasa Hukuku', 5, 4, 0.4, 0, 0, 0.6, 1, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Medeni Hukuka Giriş', 5, 4, 0.4, 0, 0, 0.6, 1, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Roma Hukuku', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Borçlar Hukuku Genel Hükümler', 5, 4, 0.4, 0, 0, 0.6, 2, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Ceza Hukuku Genel Hükümler', 5, 4, 0.4, 0, 0, 0.6, 2, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Anayasa Hukuku II', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'İdare Hukuku', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Eşya Hukuku', 5, 4, 0.4, 0, 0, 0.6, 3, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Ceza Muhakemesi Hukuku', 5, 4, 0.4, 0, 0, 0.6, 3, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Medeni Usul Hukuku', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Ticaret Hukuku I', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'İdari Yargılama Hukuku', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Aile Hukuku', 5, 4, 0.4, 0, 0, 0.6, 4, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Miras Hukuku', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Ticaret Hukuku II', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'İş Hukuku', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Devletler Özel Hukuku', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Ceza Hukuku Özel Hükümler', 5, 4, 0.4, 0, 0, 0.6, 5, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'İcra ve İflas Hukuku', 5, 4, 0.4, 0, 0, 0.6, 5, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Kamu Hukuku Uygulamaları', 4, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Devletler Umumi Hukuku', 4, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'İnsan Hakları Hukuku', 3, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Borçlar Hukuku Özel Hükümler', 5, 4, 0.4, 0, 0, 0.6, 6, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Ticari İşletme Hukuku', 4, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Deniz Ticareti Hukuku', 3, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Fikri Mülkiyet Hukuku', 3, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Hukuk Felsefesi', 3, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Avrupa Birliği Hukuku', 5, 4, 0.4, 0, 0, 0.6, 7, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Vergi Hukuku', 4, 3, 0.4, 0, 0, 0.6, 7, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Hukuk Sosyolojisi', 3, 3, 0.4, 0, 0, 0.6, 7, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Bitirme Çalışması I', 4, 4, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Seçmeli: Bankacılık Hukuku', 3, 3, 0.4, 0.1, 0, 0.5, 7, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Bitirme Çalışması II', 5, 5, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Hukuk Etik ve Mesleki Sorumluluk', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Seçmeli: Dijital Hukuk', 3, 3, 0.4, 0.1, 0, 0.5, 8, NULL),
  ('791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid, 'Seçmeli: Sağlık Hukuku', 3, 3, 0.4, 0.1, 0, 0.5, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '791f5137-d7b0-4ea2-92c4-8bf5d798d379'::uuid LIMIT 1
);

-- === Iktisat (iktisat) — 41 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'İktisada Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'İşletme İlkeleri', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Hukuk Başlangıcı', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Matematik I', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Mikro İktisat', 5, 4, 0.4, 0, 0, 0.6, 2, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Makro İktisat', 5, 4, 0.4, 0, 0, 0.6, 2, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'İstatistik I', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Genel Muhasebe', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'İleri Mikro İktisat', 5, 4, 0.4, 0, 0, 0.6, 3, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Para ve Bankacılık', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'İktisat Tarihi', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Ticaret Hukuku', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Ekonometri', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'İleri Makro İktisat', 5, 4, 0.4, 0, 0, 0.6, 4, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Maliye Teorisi', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Uluslararası İktisat', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Kalkınma İktisadı', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Türk Ekonomisi', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'İktisadi Düşünceler Tarihi', 5, 4, 0.4, 0, 0, 0.6, 5, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Para Teorisi ve Politikası', 4, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'İktisat Politikası', 4, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Büyüme ve Kalkınma', 3, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Çalışma Ekonomisi', 3, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Uluslararası Finans', 5, 4, 0.4, 0, 0, 0.6, 6, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Vergi Ekonomisi', 4, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Endüstri İktisadı', 4, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Tarım İktisadı', 3, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Çevre ve Ekonomi', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Bitirme Çalışması I', 5, 5, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Staj', 4, 0, 0, 0.5, 0.3, 0.2, 7, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Seçmeli: Davranışsal İktisat', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Seçmeli: Finansal Ekonometri', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Bitirme Çalışması II', 6, 6, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Türkiye Ekonomisi Semineri', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Seçmeli: Dijital Ekonomi', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid, 'Seçmeli: Küreselleşme', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '134f6095-c9b9-481e-8a5e-e9293dbdbe55'::uuid LIMIT 1
);

-- === Iletisim Bilimleri (iletisim-bilimleri) — 40 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'İletişim Bilimlerine Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Sosyoloji', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Psikoloji', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Türk İletişim Tarihi', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'İletişim Kuramları', 5, 4, 0.4, 0, 0, 0.6, 2, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Araştırma Yöntemleri', 4, 3, 0.4, 0.2, 0, 0.4, 2, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Kitle İletişim Araçları', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Görsel İletişim', 3, 3, 0.3, 0.3, 0.1, 0.3, 2, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'İletişim Sosyolojisi', 5, 4, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'İletişim Psikolojisi', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Medya ve Toplum', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Halkla İlişkiler', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Reklamcılığa Giriş', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Medya ve Kültür', 5, 4, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Yeni Medya Çalışmaları', 4, 3, 0.3, 0.2, 0.2, 0.3, 4, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Medya Politikaları', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Medya Ekonomisi', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'İletişim Hukuku', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Dijital İletişim', 5, 4, 0.3, 0.2, 0.2, 0.3, 5, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Medya Etik', 4, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Sosyal Medya Analizi', 4, 3, 0.2, 0.3, 0.3, 0.2, 5, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Veri Gazeteciliği', 3, 3, 0.2, 0.3, 0.3, 0.2, 5, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Medya ve Cinsiyet', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Medya ve Siyaset', 5, 4, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Uluslararası İletişim', 4, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Bitirme Projesi I', 4, 4, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Staj', 3, 0, 0, 0.5, 0.3, 0.2, 6, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Seçmeli: Dijital Pazarlama', 3, 3, 0.3, 0.3, 0.2, 0.2, 6, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Bitirme Projesi II', 5, 5, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Medya Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'İleri İletişim Araştırmaları', 3, 3, 0.3, 0.4, 0.1, 0.2, 7, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Seçmeli: Stratejik İletişim', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Bitirme Projesi III', 6, 6, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Seçmeli: VR ve İletişim', 3, 3, 0.2, 0.3, 0.3, 0.2, 8, NULL),
  ('76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid, 'Seçmeli: Transmedya Hikayeleri', 3, 3, 0.2, 0.3, 0.3, 0.2, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '76decd7e-2fbb-4738-8e5d-ef06cddbe3bf'::uuid LIMIT 1
);

-- === Ilkogretim Matematik Ogretmenligi (ilkogretim-matematik-ogretmenligi) — 41 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Analiz I', 5, 4, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Soyut Matematik', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Lineer Cebir I', 4, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Eğitim Bilimine Giriş', 3, 3, 0.4, 0.2, 0, 0.4, 1, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Bilgisayar Programlama', 3, 3, 0.3, 0.2, 0.2, 0.3, 1, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Analiz II', 5, 4, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Lineer Cebir II', 4, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Analitik Geometri', 4, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Gelişim ve Öğrenme', 3, 3, 0.4, 0.2, 0, 0.4, 2, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Soyut Cebir', 5, 4, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Diferansiyel Denklemler', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Geometri', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Öğretim İlke ve Yöntemleri', 4, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Matematik Felsefesi', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Topoloji', 5, 4, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Sayı Teorisi', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Olasılık ve İstatistik', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Matematik Öğretimi I', 4, 3, 0.3, 0.3, 0.1, 0.3, 4, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Ölçme ve Değerlendirme', 3, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Numerik Analiz', 5, 4, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Kompleks Analiz', 4, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Matematik Öğretimi II', 4, 3, 0.3, 0.3, 0.1, 0.3, 5, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Sınıf Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Rehberlik', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Matematik Tarihi', 5, 4, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Matematiksel Modelleme', 4, 3, 0.3, 0.3, 0.2, 0.2, 6, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Bilgisayar Destekli Matematik Öğretimi', 4, 3, 0.2, 0.3, 0.3, 0.2, 6, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Bitirme Çalışması I', 3, 3, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Seçmeli: İstatistik Öğretimi', 3, 3, 0.3, 0.3, 0.1, 0.3, 6, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Öğretmenlik Uygulaması I', 5, 5, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Matematik Eğitiminde Araştırma', 4, 3, 0.4, 0.3, 0, 0.3, 7, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Bitirme Çalışması II', 3, 3, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Seçmeli: Geometri Öğretimi', 3, 3, 0.3, 0.3, 0.1, 0.3, 7, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Öğretmenlik Uygulaması II', 5, 5, 0.2, 0.3, 0.3, 0.2, 8, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Matematik Eğitiminde Teknoloji', 4, 3, 0.2, 0.3, 0.3, 0.2, 8, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid, 'Seçmeli: Matematik Yarışmaları', 3, 3, 0.3, 0.3, 0.1, 0.3, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '4db8b14c-b6cf-43fd-a8ed-6fcd73b0e903'::uuid LIMIT 1
);

-- === Ingilizce Ogretmenligi (ingilizce-ogretmenligi) — 43 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'İleri İngilizce I (Okuma)', 4, 4, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'İleri İngilizce I (Yazma)', 4, 4, 0.3, 0.4, 0, 0.3, 1, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'İleri İngilizce I (Konuşma)', 3, 4, 0.4, 0.2, 0.1, 0.3, 1, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'İleri İngilizce I (Dinleme)', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'İngilizce Dilbilgisi I', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'İleri İngilizce II (Okuma)', 4, 4, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'İleri İngilizce II (Yazma)', 4, 4, 0.3, 0.4, 0, 0.3, 2, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'İleri İngilizce II (Konuşma)', 3, 4, 0.4, 0.2, 0.1, 0.3, 2, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'İleri İngilizce II (Dinleme)', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'İngilizce Dilbilgisi II', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'İngiliz Edebiyatına Giriş', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Çeviri I (İng-TR)', 4, 4, 0.3, 0.3, 0, 0.4, 3, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Linguistik I', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Yabancı Dil Eğitimine Giriş', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Bilgisayar Becerileri', 2, 2, 0.3, 0.3, 0.1, 0.3, 3, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Amerikan Edebiyatı', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Çeviri II (TR-İng)', 4, 4, 0.3, 0.3, 0, 0.4, 4, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Linguistik II', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Yabancı Dil Öğretim Yöntemleri', 4, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'İngilizce Test Hazırlama', 3, 3, 0.3, 0.3, 0.1, 0.3, 4, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'İngilizce Öğretim Materyalleri', 5, 4, 0.2, 0.3, 0.3, 0.2, 5, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'İleri Konuşma Becerileri', 4, 4, 0.4, 0.2, 0.1, 0.3, 5, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Yabancı Dil Ölçme ve Değerlendirme', 4, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Özel Öğretim Yöntemleri I', 3, 3, 0.3, 0.3, 0.1, 0.3, 5, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Sınıf Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'İngiliz Edebiyatı Klasikleri', 4, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Çocuk Edebiyatı', 3, 3, 0.3, 0.3, 0.1, 0.3, 6, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Rehberlik', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Topluma Hizmet', 2, 2, 0, 0.5, 0.3, 0.2, 6, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Özel Öğretim Yöntemleri II', 3, 3, 0.3, 0.3, 0.1, 0.3, 6, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Bitirme Çalışması I', 3, 3, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Öğretmenlik Uygulaması I', 5, 5, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'İngilizce Yeterlilik Sınavları', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'İleri Yazma Becerileri', 3, 3, 0.2, 0.5, 0, 0.3, 7, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Bitirme Çalışması II', 3, 3, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Öğretmenlik Uygulaması II', 5, 5, 0.2, 0.3, 0.3, 0.2, 8, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'İngiliz Kültürü ve Medeniyeti', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('dfe24077-4674-4c90-bab5-99862a0ef729'::uuid, 'Seçmeli: İş İngilizcesi', 3, 3, 0.3, 0.3, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = 'dfe24077-4674-4c90-bab5-99862a0ef729'::uuid LIMIT 1
);

-- === Isletme (isletme) — 41 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'İşletmeye Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'İktisada Giriş', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Hukuk Başlangıcı', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Matematik I', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Genel Muhasebe', 4, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Makro İktisat', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Ticaret Hukuku', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'İstatistik I', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Yönetim ve Organizasyon', 5, 4, 0.4, 0, 0, 0.6, 3, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Maliyet Muhasebesi', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Pazarlama İlkeleri', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Finansal Yönetim I', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'İşletme Hukuku', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Üretim Yönetimi', 5, 4, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'İnsan Kaynakları Yönetimi', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Finansal Yönetim II', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Pazar Araştırması', 4, 3, 0.3, 0.3, 0, 0.4, 4, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Muhasebe Uygulamaları', 3, 3, 0.3, 0.3, 0, 0.4, 4, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Stratejik Yönetim', 5, 4, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Uluslararası İşletmecilik', 4, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Yönetim Bilgi Sistemleri', 4, 3, 0.3, 0.2, 0.1, 0.4, 5, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Girişimcilik', 3, 3, 0.3, 0.4, 0, 0.3, 5, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Tüketici Davranışı', 3, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Proje Yönetimi', 5, 4, 0.4, 0.3, 0, 0.3, 6, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'İş Ahlakı ve Etik', 4, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Bitirme Çalışması I', 4, 4, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Staj', 3, 0, 0, 0.5, 0.3, 0.2, 6, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Seçmeli: Dijital Pazarlama', 3, 3, 0.3, 0.3, 0.1, 0.3, 6, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Bitirme Çalışması II', 5, 5, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'İleri İşletme Semineri', 4, 3, 0.4, 0.3, 0, 0.3, 7, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Seçmeli: Finansal Teknolojiler', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Seçmeli: Sürdürülebilirlik', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Bitirme Çalışması III', 6, 6, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'İşletme Politikası', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Seçmeli: Aile İşletmeleri', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid, 'Seçmeli: İnovasyon Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '694c7fd6-a121-445e-ac5e-7c0a706fe4a1'::uuid LIMIT 1
);

-- === Maliye (maliye) — 42 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'İktisada Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Hukuk Başlangıcı', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'İşletme İlkeleri', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Matematik I', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Makro İktisat', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Genel Muhasebe', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Anayasa Hukuku', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'İstatistik I', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Maliye Teorisi', 5, 4, 0.4, 0, 0, 0.6, 3, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Vergi Hukuku I', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Para ve Bankacılık', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'İktisat Politikası', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Ticaret Hukuku', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Bütçe Teorisi', 5, 4, 0.4, 0, 0, 0.6, 4, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Vergi Hukuku II', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Kamu Maliyesi', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'İşletme Finansı', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Mali Tablolar Analizi', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Devlet Bütçesi', 5, 4, 0.4, 0, 0, 0.6, 5, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Vergi Muhasebesi', 4, 3, 0.3, 0.2, 0, 0.5, 5, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Maliye Politikası', 4, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Yerel Maliye', 3, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Uluslararası Maliye', 3, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'İleri Vergi Mevzuatı', 5, 4, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Sosyal Güvenlik Kurumları', 4, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Kamu Harcamaları', 4, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Bitirme Çalışması I', 3, 3, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Seçmeli: Vergi Denetimi', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Vergi İhtilafları Çözümü', 5, 4, 0.4, 0.1, 0, 0.5, 7, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Mali Hukuk Uygulamaları', 4, 3, 0.3, 0.3, 0, 0.4, 7, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Staj', 4, 0, 0, 0.5, 0.3, 0.2, 7, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Seçmeli: Gümrük Mevzuatı', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Bitirme Çalışması II', 3, 3, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Bitirme Çalışması III', 6, 6, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Türk Mali Sistemi', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Seçmeli: Dijital Vergi Hukuku', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid, 'Seçmeli: AB Maliyesi', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '2e77abe0-ac77-433d-aa3f-f2d7fa448dc2'::uuid LIMIT 1
);

-- === Muhasebe Ve Finans Yonetimi (muhasebe-ve-finans-yonetimi) — 42 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'İktisada Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Genel Muhasebe', 5, 4, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'İşletme İlkeleri', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Hukuk Başlangıcı', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Matematik I', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Makro İktisat', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Maliyet Muhasebesi', 5, 4, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Ticaret Hukuku', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'İstatistik I', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Finansal Muhasebe', 5, 4, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Finansal Yönetim I', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Vergi Hukuku I', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Para ve Bankacılık', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Muhasebe Programları', 3, 4, 0.2, 0.3, 0.2, 0.3, 3, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'İleri Muhasebe', 5, 4, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Finansal Yönetim II', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Vergi Hukuku II', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Mali Tablolar Analizi', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Denetim', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Kurumsal Finans', 5, 4, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Uluslararası Finansal Raporlama', 4, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Yatırım Analizi', 4, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Vergi Muhasebesi', 4, 3, 0.3, 0.2, 0, 0.5, 5, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Sermaye Piyasası', 3, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Risk Yönetimi', 5, 4, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Finansal Modelleme', 4, 4, 0.2, 0.3, 0.2, 0.3, 6, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Türev Ürünler', 4, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Bitirme Çalışması I', 3, 3, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Staj', 3, 0, 0, 0.5, 0.3, 0.2, 6, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'İleri Finansal Yönetim', 5, 4, 0.4, 0.1, 0, 0.5, 7, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'İç Denetim ve Risk', 4, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Bitirme Çalışması II', 3, 3, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Seçmeli: Bankacılık Uygulamaları', 3, 3, 0.3, 0.3, 0, 0.4, 7, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Bitirme Çalışması III', 6, 6, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Finansal Etik', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Seçmeli: Fintech', 3, 3, 0.3, 0.3, 0.1, 0.3, 8, NULL),
  ('fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid, 'Seçmeli: Davranışsal Finans', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = 'fea5fdbe-6afd-4254-b139-d468740c4f18'::uuid LIMIT 1
);

-- === Okul Oncesi Ogretmenligi (okul-oncesi-ogretmenligi) — 43 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Okul Öncesi Eğitime Giriş', 4, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Çocuk Gelişimi I', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Çocuk Psikolojisi', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Eğitim Bilimine Giriş', 3, 3, 0.4, 0.2, 0, 0.4, 1, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Anatomi ve Fizyoloji', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Çocuk Gelişimi II', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Okul Öncesi Kurumlarda Yönetim', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Gelişim ve Öğrenme', 3, 3, 0.4, 0.2, 0, 0.4, 2, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Çocuk Edebiyatı', 3, 3, 0.4, 0.2, 0, 0.4, 2, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Müzik Eğitimi', 3, 3, 0.2, 0.3, 0.3, 0.2, 2, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Okul Öncesi Eğitim Programları', 5, 4, 0.3, 0.3, 0.1, 0.3, 3, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Çocuklarda Oyun Gelişimi', 4, 4, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Öğretim İlke ve Yöntemleri', 4, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Çocuk Sağlığı ve Beslenmesi', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Sanat Eğitimi', 3, 4, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Okul Öncesi Eğitim Uygulamaları', 5, 5, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Çocuk Drama', 4, 4, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Özel Eğitime Giriş', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Ölçme ve Değerlendirme', 3, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Sınıf Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Bilgisayar Destekli Eğitim', 2, 2, 0.3, 0.3, 0.1, 0.3, 4, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Erken Çocukluk Eğitiminde Materyal', 5, 5, 0.2, 0.3, 0.3, 0.2, 5, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Aile Eğitimi ve Katılımı', 4, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Rehberlik', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Çocuk İstismarı ve Korunma', 3, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Bitirme Çalışması I', 3, 3, 0, 0.4, 0.4, 0.2, 5, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Okul Öncesi Eğitiminde Araştırma', 5, 4, 0.3, 0.4, 0.1, 0.2, 6, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Karşılaştırmalı Okul Öncesi Eğitim', 4, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Topluma Hizmet', 2, 2, 0, 0.5, 0.3, 0.2, 6, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Bitirme Çalışması II', 3, 3, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Seçmeli: Müze Eğitimi', 3, 3, 0.3, 0.3, 0.1, 0.3, 6, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Öğretmenlik Uygulaması I', 5, 5, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'İleri Çocuk Gelişimi', 4, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Seçmeli: Çocuk Filmleri', 3, 3, 0.3, 0.3, 0.1, 0.3, 7, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Seçmeli: Drama Atölyesi', 3, 4, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Öğretmenlik Uygulaması II', 5, 5, 0.2, 0.3, 0.3, 0.2, 8, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Bitirme Çalışması III', 5, 5, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid, 'Seçmeli: özel Eğitim Uygulamaları', 3, 3, 0.3, 0.3, 0.1, 0.3, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = 'b0b43ae6-6052-4f5f-8e84-4a58ab064478'::uuid LIMIT 1
);

-- === Oyun Gelistirme Ve Programlama (oyun-gelistirme-ve-programlama) — 23 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, 'Programlamaya Giriş (C#)', 5, 4, 0.3, 0.2, 0.1, 0.4, 1, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, 'Oyun Tasarım İlkeleri', 4, 3, 0.4, 0.1, 0.1, 0.4, 1, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, 'Bilgisayar Grafikleri Temelleri', 3, 3, 0.4, 0.2, 0, 0.4, 1, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, 'Matematik for Oyun Geliştirme', 4, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, 'Nesne Tabanlı Programlama', 5, 4, 0.2, 0.2, 0.3, 0.3, 2, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, 'Oyun Fizik ve Simülasyon', 4, 3, 0.3, 0.2, 0.3, 0.2, 2, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, '2D Oyun Geliştirme (Unity)', 5, 5, 0.2, 0.2, 0.4, 0.2, 2, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, 'Veri Yapıları ve Algoritmalar', 4, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, '3D Oyun Geliştirme (Unity)', 6, 5, 0.2, 0.2, 0.4, 0.2, 3, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, 'Oyun Yapay Zekası', 4, 3, 0.3, 0.2, 0.3, 0.2, 3, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, 'Oyun Seviye Tasarımı', 3, 4, 0.2, 0.2, 0.4, 0.2, 3, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, 'Ağ Programlama', 4, 3, 0.2, 0.2, 0.4, 0.2, 3, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, 'Oyun Optimizasyonu', 3, 3, 0.3, 0.3, 0.2, 0.2, 3, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, 'Mobil Oyun Geliştirme', 6, 5, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, 'Çok Oyunculu Oyun Programlama', 5, 5, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, 'Oyun Test ve Debug', 3, 3, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, 'Bitirme Projesi', 6, 6, 0, 0.3, 0.5, 0.2, 4, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, 'Staj', 4, 0, 0, 0.5, 0.3, 0.2, 4, NULL),
  ('26ccd0b9-6c89-4949-8828-e6811825a521'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 4, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '26ccd0b9-6c89-4949-8828-e6811825a521'::uuid LIMIT 1
);

-- === Pazarlama (pazarlama) — 41 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'İşletmeye Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'İktisada Giriş', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Pazarlama İlkeleri', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Genel Muhasebe', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Tüketici Davranışı', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Pazar Araştırması', 4, 3, 0.3, 0.3, 0, 0.4, 2, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'İstatistik I', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Pazarlama İletişimi', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Ürün ve Fiyat Yönetimi', 5, 4, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Dağıtım Kanalları Yönetimi', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Reklam Yönetimi', 4, 3, 0.3, 0.3, 0, 0.4, 3, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Halkla İlişkiler', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Satış Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Marka Yönetimi', 5, 4, 0.3, 0.3, 0, 0.4, 4, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Uluslararası Pazarlama', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Dijital Pazarlama', 4, 3, 0.2, 0.3, 0.2, 0.3, 4, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Sosyal Medya Pazarlaması', 3, 3, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'B2B Pazarlama', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Stratejik Pazarlama', 5, 4, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Pazarlama Kampanyaları', 4, 4, 0.2, 0.3, 0.3, 0.2, 5, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'E-Ticaret', 4, 3, 0.2, 0.3, 0.2, 0.3, 5, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Müşteri İlişkileri Yönetimi', 3, 3, 0.3, 0.3, 0, 0.4, 5, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Hizmet Pazarlaması', 3, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Pazarlama Analitiği', 5, 4, 0.3, 0.3, 0.2, 0.2, 6, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Bitirme Çalışması I', 4, 4, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Staj', 3, 0, 0, 0.5, 0.3, 0.2, 6, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Seçmeli: Mobil Pazarlama', 3, 3, 0.3, 0.3, 0.1, 0.3, 6, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Seçmeli: İçerik Pazarlaması', 3, 3, 0.2, 0.4, 0.2, 0.2, 6, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Pazarlama Stratejisi Semineri', 5, 4, 0.3, 0.3, 0.2, 0.2, 7, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Bitirme Çalışması II', 4, 4, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Seçmeli: Marka Konumlandırma', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Seçmeli: Influencer Pazarlama', 3, 3, 0.3, 0.3, 0.2, 0.2, 7, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Bitirme Çalışması III', 6, 6, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Pazarlama Etik', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Seçmeli: Sürdürülebilirlik Pazarlaması', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid, 'Seçmeli: AI in Pazarlama', 3, 3, 0.3, 0.3, 0.1, 0.3, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '9b2d0c58-dc46-4367-9d38-e9316c8c49f3'::uuid LIMIT 1
);

-- === Psikoloji (psikoloji) — 42 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Genel Psikoloji I', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Psikolojiye Giriş', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'BiyoPsikolojiye Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Sosyoloji', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Genel Psikoloji II', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Gelişim Psikolojisi I', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'İstatistik I', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Anatomi ve Fizyoloji', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Bilişsel Psikoloji', 5, 4, 0.4, 0, 0, 0.6, 3, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Sosyal Psikoloji', 5, 4, 0.4, 0, 0, 0.6, 3, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Gelişim Psikolojisi II', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Araştırma Yöntemleri I', 4, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Kişilik Psikolojisi', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Klinik Psikolojiye Giriş', 5, 4, 0.4, 0, 0, 0.6, 4, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Ölçme ve Değerlendirme', 4, 3, 0.3, 0.3, 0, 0.4, 4, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Anormal Psikoloji', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Deneysel Psikoloji', 4, 4, 0.2, 0.3, 0.2, 0.3, 4, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Araştırma Yöntemleri II', 3, 3, 0.3, 0.4, 0.1, 0.2, 4, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Klinik Psikoloji', 5, 4, 0.4, 0, 0, 0.6, 5, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Psikolojik Testler', 4, 3, 0.3, 0.3, 0.1, 0.3, 5, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Endüstri ve Örgüt Psikolojisi', 4, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Sağlık Psikolojisi', 3, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Çocuk Klinik Psikolojisi', 3, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Psikoterapi Kuramları', 5, 4, 0.4, 0, 0, 0.6, 6, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Nöropsikoloji', 4, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Adli Psikoloji', 4, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Eğitim Psikolojisi', 3, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Bitirme Çalışması I', 3, 3, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Klinik Pratik I', 5, 5, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'İleri Klinik Psikoloji', 4, 3, 0.4, 0.1, 0, 0.5, 7, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Çocuk Psikoterapisi', 3, 3, 0.4, 0.1, 0, 0.5, 7, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Bitirme Çalışması II', 3, 3, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Seçmeli: Pozitif Psikoloji', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Klinik Pratik II', 6, 6, 0.2, 0.3, 0.3, 0.2, 8, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Bitirme Çalışması III', 4, 4, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Psikoloji Etik', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid, 'Seçmeli: Travma Psikolojisi', 3, 3, 0.4, 0.1, 0, 0.5, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = 'c0bcd6d9-7821-4539-9285-fe7006dc5c21'::uuid LIMIT 1
);

-- === Radyo Televizyon Ve Sinema (radyo-televizyon-ve-sinema) — 40 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'İletişim Bilimlerine Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Radyo TV''ye Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Sinema Tarihi I', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Fotoğraf I', 3, 4, 0.2, 0.2, 0.4, 0.2, 1, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Radyo TV''ye Giriş II', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Sinema Tarihi II', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Senaryo Yazarlığı I', 4, 4, 0.2, 0.4, 0, 0.4, 2, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Video Kurgu I', 4, 5, 0.2, 0.2, 0.4, 0.2, 2, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Radyo Program Yapımı', 5, 5, 0.2, 0.2, 0.4, 0.2, 3, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'TV Program Yapımı', 5, 5, 0.2, 0.2, 0.4, 0.2, 3, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Görüntü Estetiği', 4, 4, 0.3, 0.3, 0.1, 0.3, 3, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Sinema Kuramları', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Belgesel Yapımı', 3, 4, 0.2, 0.2, 0.4, 0.2, 3, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'İleri Kurgu Teknikleri', 5, 5, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Senaryo Yazarlığı II', 4, 4, 0.2, 0.4, 0, 0.4, 4, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Sinema Çekim Teknikleri', 5, 5, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Radyo TV Yönetmenliği', 4, 4, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Medya ve Toplum', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Dijital Yayıncılık', 5, 5, 0.2, 0.2, 0.4, 0.2, 5, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'İleri Sinema Çekim', 5, 5, 0.2, 0.2, 0.4, 0.2, 5, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Medya Hukuku', 4, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Türk Sineması Tarihi', 3, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Medya Etik', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Bitirme Projesi I', 5, 5, 0, 0.3, 0.5, 0.2, 6, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Stüdyo Yapım', 5, 5, 0.2, 0.2, 0.4, 0.2, 6, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Staj', 3, 0, 0, 0.5, 0.3, 0.2, 6, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Seçmeli: Podcast Yapımı', 3, 4, 0.2, 0.3, 0.3, 0.2, 6, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Seçmeli: VFX', 3, 4, 0.2, 0.2, 0.4, 0.2, 6, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Bitirme Projesi II', 6, 6, 0, 0.3, 0.5, 0.2, 7, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'İleri Belgesel Yapımı', 3, 4, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Seçmeli: Streaming Yayıncılık', 3, 4, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Seçmeli: VR Film Yapımı', 3, 4, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Bitirme Projesi III', 7, 8, 0, 0.3, 0.5, 0.2, 8, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Medya Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('b213868e-b64e-4382-83fd-467af620953a'::uuid, 'Seçmeli: Dijital Dağıtım', 3, 3, 0.3, 0.3, 0.2, 0.2, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = 'b213868e-b64e-4382-83fd-467af620953a'::uuid LIMIT 1
);

-- === Rehberlik Ve Psikolojik Danismanlik (rehberlik-ve-psikolojik-danismanlik) — 41 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Eğitim Bilimine Giriş', 4, 3, 0.4, 0.2, 0, 0.4, 1, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Genel Psikoloji', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Gelişim Psikolojisi I', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Bilgisayar Becerileri', 2, 2, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Eğitim Psikolojisi', 4, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Gelişim Psikolojisi II', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Rehberliğe Giriş', 4, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Anatomi ve Fizyoloji', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Öğretim İlke ve Yöntemleri', 4, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Bireysel Rehberlik', 5, 4, 0.3, 0.3, 0.1, 0.3, 3, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Ölçme ve Değerlendirme', 4, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Sosyal Psikoloji', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'İstatistik', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Grupla Rehberlik', 5, 4, 0.3, 0.3, 0.1, 0.3, 4, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Mesleki Rehberlik', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Kişilik Psikolojisi', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Özel Eğitime Giriş', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Sınıf Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'İleri Rehberlik Teknikleri', 5, 4, 0.3, 0.3, 0.1, 0.3, 5, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Psikolojik Danışma Kuramları', 5, 4, 0.4, 0, 0, 0.6, 5, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Aile Danışmanlığı', 4, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Klinik Psikolojiye Giriş', 4, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Çocuk ve Ergen Psikolojisi', 3, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Psikolojik Testler', 5, 4, 0.3, 0.3, 0.1, 0.3, 6, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Oyun Terapisi', 4, 4, 0.2, 0.3, 0.3, 0.2, 6, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Travma ve Kriz Müdahalesi', 4, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Bitirme Çalışması I', 3, 3, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Seçmeli: Sanat Terapisi', 3, 4, 0.2, 0.3, 0.3, 0.2, 6, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Okul Uygulaması I', 5, 5, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'İleri Psikolojik Danışma', 4, 4, 0.3, 0.3, 0.1, 0.3, 7, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Bitirme Çalışması II', 3, 3, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Seçmeli: Bilişsel Davranışçı Terapi', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Okul Uygulaması II', 6, 6, 0.2, 0.3, 0.3, 0.2, 8, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Bitirme Çalışması III', 4, 4, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Rehberlik Etik', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('d16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid, 'Seçmeli: Pozitif Psikoloji Uygulamaları', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = 'd16c80f8-f037-4e8a-9ab4-c45d12ea7149'::uuid LIMIT 1
);

-- === Reklamcilik (reklamcilik) — 37 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Reklamcılığa Giriş', 4, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'İletişim Bilimlerine Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Pazarlama İlkeleri', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Tüketici Davranışı', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Reklam Yazarlığı I', 4, 4, 0.2, 0.4, 0, 0.4, 2, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Reklam Tasarımı I', 4, 4, 0.2, 0.2, 0.4, 0.2, 2, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Reklam Araştırması', 3, 3, 0.3, 0.3, 0, 0.4, 2, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Görsel İletişim', 3, 3, 0.3, 0.3, 0.1, 0.3, 2, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Bütünleşik Pazarlama İletişimi', 5, 4, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Reklam Kampanyaları', 4, 4, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Medya Planlama', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Reklam Yazarlığı II', 3, 4, 0.2, 0.4, 0, 0.4, 3, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Dijital Reklamcılık', 3, 3, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Reklam Tasarımı II', 5, 5, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Marka İletişimi', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Sosyal Medya Reklamları', 4, 4, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Mobil Pazarlama', 3, 3, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Halkla İlişkiler', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Yaratıcı Strateji', 5, 4, 0.3, 0.3, 0.2, 0.2, 5, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Bitirme Projesi I', 4, 4, 0, 0.4, 0.4, 0.2, 5, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Staj', 3, 0, 0, 0.5, 0.3, 0.2, 5, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Seçmeli: E-sports Pazarlama', 3, 3, 0.3, 0.3, 0.2, 0.2, 5, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Bitirme Projesi II', 6, 6, 0, 0.3, 0.5, 0.2, 6, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Reklam Yönetimi', 4, 4, 0.3, 0.3, 0.2, 0.2, 6, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Seçmeli: Influencer Pazarlama', 3, 3, 0.3, 0.3, 0.2, 0.2, 6, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Seçmeli: İçerik Pazarlaması', 3, 3, 0.2, 0.4, 0.2, 0.2, 6, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Bitirme Projesi III', 6, 8, 0, 0.3, 0.5, 0.2, 7, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Reklam Ajansı Yönetimi', 4, 4, 0.4, 0.3, 0, 0.3, 7, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Seçmeli: VR Reklamcılık', 3, 4, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Bitirme Projesi IV', 7, 10, 0, 0.3, 0.5, 0.2, 8, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Reklam Etik', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid, 'Seçmeli: AI in Reklamcılık', 3, 3, 0.3, 0.3, 0.2, 0.2, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '8e579c48-c607-44ea-9fa9-311fff44f9aa'::uuid LIMIT 1
);

-- === Resim (resim) — 40 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Temel Sanat Eğitimi I', 4, 5, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Desen I', 4, 5, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Resim I (Yağlı Boya)', 4, 5, 0.3, 0.2, 0.3, 0.2, 1, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Sanat Tarihi I', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Temel Sanat Eğitimi II', 4, 5, 0.3, 0.3, 0.1, 0.3, 2, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Desen II', 4, 5, 0.3, 0.3, 0.1, 0.3, 2, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Resim II (Yağlı Boya)', 4, 5, 0.3, 0.2, 0.3, 0.2, 2, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Sanat Tarihi II', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'İleri Desen', 4, 5, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Resim III', 4, 5, 0.2, 0.2, 0.4, 0.2, 3, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Anatomi', 3, 4, 0.3, 0.3, 0.1, 0.3, 3, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Perspektif', 3, 4, 0.3, 0.3, 0.1, 0.3, 3, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Türk Sanatı Tarihi', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Resim IV', 4, 5, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Yağlı Boya Teknikleri', 4, 5, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Sulu Boya', 3, 4, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Karışık Teknik', 3, 4, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Çağdaş Sanat', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Atölye I (Seçmeli Teknik)', 5, 6, 0.2, 0.2, 0.4, 0.2, 5, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Dijital Resim', 4, 5, 0.2, 0.2, 0.4, 0.2, 5, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Sanat Felsefesi', 3, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'İllüstrasyon', 3, 4, 0.2, 0.2, 0.4, 0.2, 5, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Sanat Eleştirisi', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Atölye II (Seçmeli Teknik)', 5, 6, 0.2, 0.2, 0.4, 0.2, 6, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Bitirme Projesi I', 4, 5, 0, 0.3, 0.5, 0.2, 6, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Deneysel Resim', 3, 4, 0.2, 0.2, 0.4, 0.2, 6, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Sanat Yönetimi', 3, 3, 0.4, 0.3, 0, 0.3, 6, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Bitirme Projesi II', 5, 6, 0, 0.3, 0.5, 0.2, 7, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Müze ve Galeri Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Seçmeli: Soyut Resim', 3, 4, 0.2, 0.2, 0.4, 0.2, 7, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Seçmeli: Portre Resim', 3, 4, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Bitirme Projesi III', 6, 8, 0, 0.3, 0.5, 0.2, 8, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Portföy ve Sergi Hazırlama', 3, 3, 0.2, 0.4, 0.2, 0.2, 8, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Seçmeli: Sanat Girişimciliği', 3, 3, 0.4, 0.3, 0, 0.3, 8, NULL),
  ('3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid, 'Seçmeli: Dijital Sanat', 3, 4, 0.2, 0.2, 0.4, 0.2, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '3c57dea9-4dd2-44f0-8ce3-ee3ab18e0b49'::uuid LIMIT 1
);

-- === Rus Dili Ve Edebiyati (rus-dili-ve-edebiyati) — 40 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Rusça Dilbilgisi I', 4, 4, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Rusça Okuma I', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Rusça Konuşma I', 3, 3, 0.4, 0.1, 0.1, 0.4, 1, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Rus Edebiyatına Giriş', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Rusça Dilbilgisi II', 4, 4, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Rusça Okuma II', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Rusça Konuşma II', 3, 3, 0.4, 0.1, 0.1, 0.4, 2, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Rus Edebiyatı Tarihi', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Rusça Çeviri I', 4, 4, 0.3, 0.3, 0, 0.4, 3, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Rus Klasikleri', 4, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Linguistik I', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Rus Kültürü ve Medeniyeti', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Rusça Yazma I', 3, 3, 0.3, 0.4, 0, 0.3, 3, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Rusça Çeviri II', 4, 4, 0.3, 0.3, 0, 0.4, 4, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Çağdaş Rus Edebiyatı', 4, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Linguistik II', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Rus Sineması', 3, 3, 0.3, 0.2, 0.2, 0.3, 4, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Rusça Yazma II', 3, 3, 0.3, 0.4, 0, 0.3, 4, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, '19. Yüzyıl Rus Edebiyatı', 5, 4, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Rus Şiiri', 4, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Rus Edebiyatı Analizi', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Çocuk Edebiyatı', 3, 3, 0.3, 0.3, 0.1, 0.3, 5, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Rusça İş Rusçası', 3, 3, 0.3, 0.3, 0, 0.4, 5, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, '20. Yüzyıl Rus Edebiyatı', 5, 4, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Rus Edebiyatı Semineri', 4, 4, 0.2, 0.3, 0.2, 0.3, 6, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Karşılaştırmalı Edebiyat', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Türk-Rus Kültürel İlişkileri', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Bitirme Çalışması I', 3, 3, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Bitirme Çalışması II', 5, 5, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Çeviri Uygulamaları', 4, 4, 0.2, 0.3, 0.2, 0.3, 7, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Seçmeli: Rus Felsefesi', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Seçmeli: Slav Dilleri', 3, 3, 0.4, 0.1, 0, 0.5, 7, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Bitirme Çalışması III', 6, 6, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Seçmeli: Rus Tiyatrosu', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid, 'Seçmeli: Sovyet Edebiyatı', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '4bafb952-c1f4-40cc-8acb-b23860a3248a'::uuid LIMIT 1
);

-- === Sac Bakimi Ve Guzellik Hizmetleri (sac-bakimi-ve-guzellik-hizmetleri) — 23 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'Cilt Bakımına Giriş', 4, 4, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'Saç Bakımına Giriş', 4, 4, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'Anatomi ve Fizyoloji', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'Mesleki Hijyen ve Sanitasyon', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'Cilt Bakım Uygulamaları', 4, 5, 0.2, 0.3, 0.3, 0.2, 2, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'Saç Bakım Uygulamaları', 4, 5, 0.2, 0.3, 0.3, 0.2, 2, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'Makyaj Teknikleri', 3, 4, 0.2, 0.3, 0.3, 0.2, 2, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'Saç Tasarımı', 3, 4, 0.2, 0.3, 0.3, 0.2, 2, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'İleri Cilt Bakım', 5, 5, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'İleri Saç Bakım', 5, 5, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'Kalıcı Makyaj', 3, 4, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'Saç Boyama Teknikleri', 3, 4, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'Cilt Hastalıkları', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'Epilasyon Uygulamaları', 5, 5, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'İleri Makyaj', 4, 5, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'Güzellik Salonu Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'Müşteri İlişkileri', 3, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'Staj', 4, 0, 0, 0.5, 0.3, 0.2, 4, NULL),
  ('456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 4, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '456b97d4-1642-4ac0-8b79-a4a5116b471c'::uuid LIMIT 1
);

-- === Sanat Tarihi (sanat-tarihi) — 41 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Sanat Tarihi Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'İlkçağ Sanatı', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Arkeolojiye Giriş', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Mitoloji', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Yunan Sanatı', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Roma Sanatı', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Erken Hristiyan ve Bizans Sanatı', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Antik Coğrafya', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'İslam Sanatı', 5, 4, 0.4, 0, 0, 0.6, 3, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Avrupa Ortaçağ Sanatı', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Türk Sanatı I', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Sanat Sosyolojisi', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Sanat Felsefesi', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Rönesans Sanatı', 5, 4, 0.4, 0, 0, 0.6, 4, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Avrupa Sanatı (15-18 YY)', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Osmanlı Sanatı', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Mimari Tarihi', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Sanat Eleştirisi', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, '19. Yüzyıl Sanatı', 5, 4, 0.4, 0, 0, 0.6, 5, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Çağdaş Sanat Akımları I', 4, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Türk Sanatı II', 4, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Müzecilik', 3, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'İkonografi', 3, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, '20. Yüzyıl Sanatı', 5, 4, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Çağdaş Sanat Akımları II', 4, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Türk Cumhuriyet Dönemi Sanatı', 4, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Bitirme Çalışması I', 3, 3, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Seçmeli: Sinema Tarihi', 3, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Bitirme Çalışması II', 5, 5, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Sanat Tarihi Yöntemleri', 4, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Seçmeli: Fotoğraf Tarihi', 3, 3, 0.4, 0.1, 0, 0.5, 7, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Seçmeli: Süsleme Sanatları', 3, 3, 0.4, 0.1, 0, 0.5, 7, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Bitirme Çalışması III', 6, 6, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Müze ve Galeri Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Seçmeli: Sanat Piyasası', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid, 'Seçmeli: Dijital Sanat Tarihi', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = 'b8461b2a-91ed-4f46-99e3-0b9a5e2cf9e8'::uuid LIMIT 1
);

-- === Seramik (seramik) — 40 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Temel Sanat Eğitimi I', 4, 5, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Seramiğe Giriş', 4, 5, 0.2, 0.2, 0.4, 0.2, 1, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Çamur Hazırlama', 3, 4, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Desen I', 3, 4, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Sanat Tarihi I', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Temel Sanat Eğitimi II', 4, 5, 0.3, 0.3, 0.1, 0.3, 2, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'El Şekillendirme I', 4, 5, 0.2, 0.2, 0.4, 0.2, 2, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Çark Techniques', 4, 5, 0.2, 0.2, 0.4, 0.2, 2, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Desen II', 3, 4, 0.3, 0.3, 0.1, 0.3, 2, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Sanat Tarihi II', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Sırlama Teknikleri', 4, 5, 0.2, 0.2, 0.4, 0.2, 3, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Dekoratif Teknikler', 4, 5, 0.2, 0.2, 0.4, 0.2, 3, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Seramik Tarihi', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Türk Seramik Tarihi', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Model ve Kalıp', 3, 4, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Atölye I', 5, 6, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Seramik Tasarımı', 4, 5, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Porselen Çalışmaları', 3, 4, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Çağdaş Seramik', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Endüstriyel Seramik', 3, 4, 0.3, 0.3, 0.1, 0.3, 4, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Atölye II', 5, 6, 0.2, 0.2, 0.4, 0.2, 5, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Dijital Seramik Tasarım', 4, 5, 0.2, 0.2, 0.4, 0.2, 5, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Sanat Felsefesi', 3, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Seramik Restorasyon', 3, 4, 0.2, 0.2, 0.4, 0.2, 5, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Seçmeli: Mosaic Sanatı', 3, 4, 0.2, 0.2, 0.4, 0.2, 5, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Atölye III', 5, 6, 0.2, 0.2, 0.4, 0.2, 6, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Bitirme Projesi I', 4, 5, 0, 0.3, 0.5, 0.2, 6, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Seramik Üretim Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Seçmeli: Cam Sanatı', 3, 4, 0.2, 0.2, 0.4, 0.2, 6, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Bitirme Projesi II', 5, 6, 0, 0.3, 0.5, 0.2, 7, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Sanat Eleştirisi', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Seçmeli: Mimari Seramik', 3, 4, 0.2, 0.2, 0.4, 0.2, 7, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Bitirme Projesi III', 6, 8, 0, 0.3, 0.5, 0.2, 8, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Portföy ve Sergi Hazırlama', 3, 3, 0.2, 0.4, 0.2, 0.2, 8, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid, 'Seçmeli: Sanat Girişimciliği', 3, 3, 0.4, 0.3, 0, 0.3, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = 'a30f7767-aa27-4400-8a27-dfce36d54f16'::uuid LIMIT 1
);

-- === Siyaset Bilimi Ve Kamu Yonetimi (siyaset-bilimi-ve-kamu-yonetimi) — 41 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Siyaset Bilimine Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Hukuk Başlangıcı', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Sosyoloji', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Anayasa Hukuku', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Siyaset Kuramları', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Kamu Yönetimine Giriş', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Türk Siyasal Hayatı', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'İktisada Giriş', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Karşılaştırmalı Siyaset', 5, 4, 0.4, 0, 0, 0.6, 3, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'İdare Hukuku', 5, 4, 0.4, 0, 0, 0.6, 3, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Türk İdare Tarihi', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Siyaset Sosyolojisi', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'İstatistik', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Yerel Yönetimler', 5, 4, 0.4, 0, 0, 0.6, 4, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Siyaset Felsefesi', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'İdari Yargılama', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Kamu Politikası', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Araştırma Yöntemleri', 3, 3, 0.3, 0.3, 0, 0.4, 4, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Türk Dış Politikası I', 5, 4, 0.4, 0, 0, 0.6, 5, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Kamu Personel Yönetimi', 4, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Devlet Bütçesi', 4, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Avrupa Birliği Politikaları', 3, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Sosyal Psikoloji', 3, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Türk Dış Politikası II', 5, 4, 0.4, 0, 0, 0.6, 6, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Yönetim Bilimi', 4, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Kentleşme ve Çevre', 3, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Bitirme Çalışması I', 3, 3, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Seçmeli: Dijital Devlet', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Bitirme Çalışması II', 5, 5, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Staj', 4, 0, 0, 0.5, 0.3, 0.2, 7, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Seçmeli: Karşılaştırmalı Kamu Yönetimi', 3, 3, 0.4, 0.1, 0, 0.5, 7, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Seçmeli: Politika Analizi', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Bitirme Çalışması III', 6, 6, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Kamu Yönetimi Etik', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Seçmeli: İnsan Hakları', 3, 3, 0.4, 0.1, 0, 0.5, 8, NULL),
  ('1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid, 'Seçmeli: Çağdaş Siyasal Sistemler', 3, 3, 0.4, 0.1, 0, 0.5, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '1bf80578-8085-4fe3-ba29-f57f53f1d455'::uuid LIMIT 1
);

-- === Sinif Ogretmenligi (sinif-ogretmenligi) — 43 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Eğitim Bilimine Giriş', 4, 3, 0.4, 0.2, 0, 0.4, 1, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Türkçe I (Okuma Yazma)', 4, 4, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Matematik I', 4, 4, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Fen Bilgisi I', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Bilgisayar Becerileri', 2, 2, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Gelişim ve Öğrenme', 4, 3, 0.4, 0.2, 0, 0.4, 2, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Türkçe II', 4, 4, 0.3, 0.3, 0.1, 0.3, 2, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Matematik II', 4, 4, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Fen Bilgisi II', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Sosyal Bilgiler', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Öğretim İlke ve Yöntemleri', 5, 4, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Türkçe Öğretimi I', 4, 4, 0.3, 0.3, 0.1, 0.3, 3, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Matematik Öğretimi I', 4, 4, 0.3, 0.3, 0.1, 0.3, 3, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Fen Öğretimi I', 3, 4, 0.3, 0.3, 0.1, 0.3, 3, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Sınıf Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Müzik Öğretimi', 2, 3, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Türkçe Öğretimi II', 5, 4, 0.3, 0.3, 0.1, 0.3, 4, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Matematik Öğretimi II', 5, 4, 0.3, 0.3, 0.1, 0.3, 4, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Fen Öğretimi II', 4, 4, 0.3, 0.3, 0.1, 0.3, 4, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Sosyal Bilgiler Öğretimi', 4, 4, 0.3, 0.3, 0.1, 0.3, 4, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Ölçme ve Değerlendirme', 3, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Görsel Sanatlar Öğretimi', 2, 3, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Özel Öğretim Yöntemleri I', 5, 4, 0.3, 0.3, 0.1, 0.3, 5, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Rehberlik', 4, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Özel Eğitime Giriş', 4, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Topluma Hizmet', 2, 2, 0, 0.5, 0.3, 0.2, 5, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Seçmeli: Drama', 3, 3, 0.2, 0.3, 0.3, 0.2, 5, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Özel Öğretim Yöntemleri II', 5, 4, 0.3, 0.3, 0.1, 0.3, 6, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Beden Eğitimi Öğretimi', 3, 3, 0.3, 0.3, 0.1, 0.3, 6, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Bitirme Çalışması I', 3, 3, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Seçmeli: Çocuk Edebiyatı', 3, 3, 0.3, 0.3, 0.1, 0.3, 6, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Seçmeli: İlk Okuma Yazma', 3, 3, 0.3, 0.3, 0.1, 0.3, 6, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Öğretmenlik Uygulaması I', 6, 6, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Bitirme Çalışması II', 3, 3, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Seçmeli: Sınıf Öğretmenliğinde İnovasyon', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Öğretmenlik Uygulaması II', 8, 8, 0.2, 0.3, 0.3, 0.2, 8, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Bitirme Çalışması III', 3, 3, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid, 'Seçmeli: Kırsal Bölgelerde Eğitim', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = 'a81c81b3-37dc-4682-9129-a380d1f4bf81'::uuid LIMIT 1
);

-- === Sosyal Bilgiler Ogretmenligi (sosyal-bilgiler-ogretmenligi) — 41 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Eğitim Bilimine Giriş', 4, 3, 0.4, 0.2, 0, 0.4, 1, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Tarih I (İlk ve Orta Çağ)', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Coğrafya I', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Vatandaşlık Bilgisi', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Gelişim ve Öğrenme', 4, 3, 0.4, 0.2, 0, 0.4, 2, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Tarih II (Yeni ve Yakın Çağ)', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Coğrafya II', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Sosyolojiye Giriş', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Öğretim İlke ve Yöntemleri', 4, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Sosyal Bilgiler Öğretimi I', 5, 4, 0.3, 0.3, 0.1, 0.3, 3, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Türk İnkılap Tarihi', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'İktisada Giriş', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Anayasa Hukuku', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Sosyal Bilgiler Öğretimi II', 5, 4, 0.3, 0.3, 0.1, 0.3, 4, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Türk Kültürü', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Felsefe', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Ölçme ve Değerlendirme', 3, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Sınıf Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Sosyal Bilgiler Öğretim Programları', 5, 4, 0.3, 0.3, 0.1, 0.3, 5, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Rehberlik', 4, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Türk Dış Politikası', 3, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Avrupa Birliği', 3, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Bilgisayar Destekli Öğretim', 2, 2, 0.3, 0.3, 0.1, 0.3, 5, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'İleri Sosyal Bilgiler Öğretimi', 5, 4, 0.3, 0.3, 0.1, 0.3, 6, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Topluma Hizmet', 2, 2, 0, 0.5, 0.3, 0.2, 6, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Bitirme Çalışması I', 3, 3, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Seçmeli: Coğrafi Bilgi Sistemleri', 3, 3, 0.3, 0.3, 0.1, 0.3, 6, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Seçmeli: Müze Eğitimi', 3, 3, 0.3, 0.3, 0.1, 0.3, 6, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Öğretmenlik Uygulaması I', 6, 6, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Bitirme Çalışması II', 3, 3, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Seçmeli: Değerler Eğitimi', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Seçmeli: Karşılaştırmalı Eğitim', 3, 3, 0.4, 0.1, 0, 0.5, 7, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Öğretmenlik Uygulaması II', 8, 8, 0.2, 0.3, 0.3, 0.2, 8, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Bitirme Çalışması III', 3, 3, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Seçmeli: İnsan Hakları Eğitimi', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid, 'Seçmeli: Halk Kültürü', 3, 3, 0.4, 0.1, 0, 0.5, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '560721d2-66cd-4e56-82fe-a8c449dd0ec9'::uuid LIMIT 1
);

-- === Sosyal Hizmet (sosyal-hizmet) — 41 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Sosyal Hizmete Giriş', 4, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Sosyoloji', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Psikoloji', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Anatomi ve Fizyoloji', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Sosyal Hizmet Tarihi', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Sosyal Politika', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Sosyal Hizmet Kuramları', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'İnsan Davranışı ve Sosyal Çevre', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Sosyal Hizmette Araştırma', 5, 4, 0.3, 0.3, 0, 0.4, 3, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Sosyal Hizmette Görüşme', 4, 4, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Çocuk Refahı', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Aile ve Çift Danışmanlığı', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Halk Sağlığı', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Sosyal Hizmette Etik', 5, 4, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Grupla Sosyal Hizmet', 4, 4, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Yaşlı Refahı', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Engelli Refahı', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Kadın Sorunları ve Sosyal Hizmet', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Toplumla Sosyal Hizmet', 5, 4, 0.2, 0.3, 0.3, 0.2, 5, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Medikal Sosyal Hizmet', 4, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Okul Sosyal Hizmeti', 4, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Adli Sosyal Hizmet', 3, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Krize Müdahale', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Sosyal Hizmet Uygulaması I', 5, 5, 0.2, 0.3, 0.3, 0.2, 6, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Ruh Sağlığı ve Sosyal Hizmet', 4, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Madde Bağımlılığı', 3, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Sosyal Hizmette Proje Yönetimi', 3, 3, 0.3, 0.4, 0.1, 0.2, 6, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Bitirme Çalışması I', 3, 3, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Sosyal Hizmet Uygulaması II', 6, 6, 0.2, 0.3, 0.3, 0.2, 7, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'İleri Sosyal Hizmet Semineri', 4, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Seçmeli: Göç ve Sosyal Hizmet', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Bitirme Çalışması II', 3, 3, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Sosyal Hizmet Uygulaması III', 8, 8, 0.2, 0.3, 0.3, 0.2, 8, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Bitirme Çalışması III', 4, 4, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Seçmeli: Sivil Toplum Kuruluşları', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('26d67854-0889-49f8-bec7-219061b74c3a'::uuid, 'Seçmeli: İnsan Hakları', 3, 3, 0.4, 0.1, 0, 0.5, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '26d67854-0889-49f8-bec7-219061b74c3a'::uuid LIMIT 1
);

-- === Sosyoloji (sosyoloji) — 41 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Sosyolojiye Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Felsefe', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Sosyal Psikoloji', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Bilgisayar Becerileri', 2, 2, 0.3, 0.3, 0.1, 0.3, 1, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Sosyolojik Kuramlar I', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Sosyolojik Düşünceler Tarihi', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Araştırma Yöntemleri I', 4, 3, 0.4, 0.2, 0, 0.4, 2, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'İstatistik I', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Sosyolojik Kuramlar II', 5, 4, 0.4, 0, 0, 0.6, 3, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Türk Toplum Yapısı', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Aile Sosyolojisi', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Kent Sosyolojisi', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Sanat Sosyolojisi', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Karşılaştırmalı Sosyoloji', 5, 4, 0.4, 0, 0, 0.6, 4, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Din Sosyolojisi', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Eğitim Sosyolojisi', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Siyaset Sosyolojisi', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Araştırma Yöntemleri II', 3, 3, 0.3, 0.4, 0.1, 0.2, 4, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Çalışma Sosyolojisi', 5, 4, 0.4, 0, 0, 0.6, 5, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Kültür Sosyolojisi', 4, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Sağlık Sosyolojisi', 4, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Sosyal Hareketler', 3, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Çevre Sosyolojisi', 3, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Türkiye''nin Sosyal Yapısı', 5, 4, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Azınlık Sosyolojisi', 4, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Medya Sosyolojisi', 4, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Bitirme Çalışması I', 3, 3, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Seçmeli: Göç Sosyolojisi', 3, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Bitirme Çalışması II', 5, 5, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Sosyolojik Analiz', 4, 3, 0.4, 0.3, 0, 0.3, 7, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Staj', 3, 0, 0, 0.5, 0.3, 0.2, 7, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Seçmeli: Dijital Sosyoloji', 3, 3, 0.3, 0.3, 0.1, 0.3, 7, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Bitirme Çalışması III', 6, 6, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Sosyoloji Etik', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Seçmeli: Küreselleşme Sosyolojisi', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('b788238e-0037-43ef-9bc1-fccfea890101'::uuid, 'Seçmeli: Cinsiyet Sosyolojisi', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = 'b788238e-0037-43ef-9bc1-fccfea890101'::uuid LIMIT 1
);

-- === Tibbi Laboratuvar Teknikleri (tibbi-laboratuvar-teknikleri) — 23 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'Anatomi', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'Fizyoloji', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'Genel Biyoloji', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'Genel Kimya', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'Biokimya', 4, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'Mikrobiyoloji', 4, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'Hematoloji I', 4, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'Laboratuvar Cihazleri', 3, 3, 0.4, 0.2, 0, 0.4, 2, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'Klinik Biokimya', 5, 4, 0.3, 0.3, 0.1, 0.3, 3, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'Hematoloji II', 4, 3, 0.4, 0.2, 0, 0.4, 3, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'İdrar Analizi', 4, 4, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'Parazitoloji', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'Tıbbi Mikrobiyoloji', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'Klinik Mikrobiyoloji', 5, 4, 0.3, 0.3, 0.1, 0.3, 4, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'İmmünoloji', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'Viroloji', 4, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'Tıbbi Patoloji', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'Staj', 4, 0, 0, 0.5, 0.3, 0.2, 4, NULL),
  ('b5264045-5802-45d7-89da-a86f02497ded'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 4, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = 'b5264045-5802-45d7-89da-a86f02497ded'::uuid LIMIT 1
);

-- === Turizm Rehberligi (turizm-rehberligi) — 41 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Turizm İlkeleri', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Anadolu Coğrafyası', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Türk Tarihi I', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'İngilizce I', 4, 4, 0.4, 0.1, 0.1, 0.4, 1, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Türk Tarihi II', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Mitoloji', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Arkeoloji ve Sanat Tarihi', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'İngilizce II', 4, 4, 0.4, 0.1, 0.1, 0.4, 2, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Turizm Coğrafyası', 5, 4, 0.4, 0, 0, 0.6, 3, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Türk Mutfağı ve Kültürü', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Rehberlik Uygulamaları I', 5, 5, 0.2, 0.2, 0.4, 0.2, 3, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'İkinci Yabancı Dil I (Almanca)', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Halk Kültürü', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'İleri Rehberlik Uygulamaları', 5, 5, 0.2, 0.2, 0.4, 0.2, 4, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Turizm Mevzuatı', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'İkinci Yabancı Dil II', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'İletişim Becerileri', 3, 3, 0.3, 0.3, 0.1, 0.3, 4, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Staj', 4, 0, 0, 0.5, 0.3, 0.2, 4, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'İleri İngilizce (Rehberlik)', 5, 5, 0.3, 0.3, 0.1, 0.3, 5, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Türk Arkeolojisi', 4, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Turizm Pazarlaması', 4, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Türkiye''de Turizm Bölgeleri', 4, 4, 0.3, 0.3, 0.1, 0.3, 5, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Müzecilik', 3, 3, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Bitirme Çalışması I', 5, 5, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Doğa Turizmi ve Ekoturizm', 4, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Turizm Sosyolojisi', 3, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Seçmeli: Kültürel Miras', 3, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Seçmeli: Alternatif Turizm', 3, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Bitirme Çalışması II', 6, 6, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'İleri Rehberlik Semineri', 4, 4, 0.3, 0.3, 0.2, 0.2, 7, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Seçmeli: Türk El Sanatları', 3, 3, 0.4, 0.1, 0, 0.5, 7, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Seçmeli: Dünya Turizm Coğrafyası', 3, 3, 0.4, 0, 0, 0.6, 7, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Bitirme Çalışması III', 7, 8, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Turizm Etik', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Seçmeli: Dijital Turizm', 3, 3, 0.3, 0.3, 0.1, 0.3, 8, NULL),
  ('6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid, 'Seçmeli: Sürdürülebilir Turizm', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '6fc87e2c-31ca-4418-bd75-7114163ab606'::uuid LIMIT 1
);

-- === Turizm Ve Otel Isletmeciligi (turizm-ve-otel-isletmeciligi) — 41 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Turizme Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'İşletme İlkeleri', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Otel İşletmeciliğine Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'İngilizce I', 4, 4, 0.4, 0.1, 0.1, 0.4, 1, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Turizm Ekonomisi', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Ön Büro Yönetimi', 4, 4, 0.3, 0.3, 0.1, 0.3, 2, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Konaklama Hizmetleri', 4, 4, 0.3, 0.3, 0.1, 0.3, 2, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'İngilizce II', 4, 4, 0.4, 0.1, 0.1, 0.4, 2, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Kat Hizmetleri Yönetimi', 5, 5, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Yiyecek İçecek Yönetimi', 5, 5, 0.2, 0.3, 0.3, 0.2, 3, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Turizm Pazarlaması', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Muhasebe (Turizm)', 4, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'İkinci Yabancı Dil I (Almanca)', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Otel Muhasebesi', 5, 4, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'İleri Yiyecek İçecek', 4, 4, 0.2, 0.3, 0.3, 0.2, 4, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Turizm Mevzuatı', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Müşteri İlişkileri Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 4, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'İkinci Yabancı Dil II', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Otel Yönetim Sistemleri', 5, 4, 0.3, 0.3, 0.2, 0.2, 5, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Turizm Sosyolojisi', 4, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Etkinlik ve Kongre Yönetimi', 4, 4, 0.2, 0.3, 0.3, 0.2, 5, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'İleri İngilizce (Turizm)', 4, 4, 0.3, 0.3, 0.1, 0.3, 5, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'İnsan Kaynakları Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 5, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Bitirme Çalışması I', 5, 5, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Stratejik Otel Yönetimi', 4, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Staj', 3, 0, 0, 0.5, 0.3, 0.2, 6, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Seçmeli: Dijital Pazarlama (Turizm)', 3, 3, 0.3, 0.3, 0.1, 0.3, 6, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Seçmeli: Sürdürülebilir Turizm', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Bitirme Çalışması II', 6, 6, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Turizmde Kalite Yönetimi', 4, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Seçmeli: Kültürel Turizm', 3, 3, 0.4, 0.1, 0, 0.5, 7, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Seçmeli: Kruvaziyer Yönetimi', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Bitirme Çalışması III', 7, 8, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Turizm Etik', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Seçmeli: Turizm Teknolojileri', 3, 3, 0.3, 0.3, 0.1, 0.3, 8, NULL),
  ('6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid, 'Seçmeli: Sağlık Turizmi', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '6d070a9b-1f2f-45f0-92dc-155a106ef1fe'::uuid LIMIT 1
);

-- === Turk Dili Ve Edebiyati (turk-dili-ve-edebiyati) — 44 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Eski Türk Edebiyatı I', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Yeni Türk Edebiyatı I', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Türk Halk Edebiyatı I', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Türk Dili Tarihi I', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Osmanlı Türkçesi I', 3, 3, 0.4, 0.1, 0, 0.5, 1, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Eski Türk Edebiyatı II', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Yeni Türk Edebiyatı II', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Türk Halk Edebiyatı II', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Türk Dili Tarihi II', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Osmanlı Türkçesi II', 3, 3, 0.4, 0.1, 0, 0.5, 2, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Eski Türk Edebiyatı III', 5, 4, 0.4, 0, 0, 0.6, 3, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Yeni Türk Edebiyatı III', 5, 4, 0.4, 0, 0, 0.6, 3, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Türk Halk Edebiyatı III', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Türk Dili III', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Osmanlı Türkçesi III', 3, 3, 0.4, 0.1, 0, 0.5, 3, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Edebiyat Teorisi', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Eski Türk Edebiyatı IV', 5, 4, 0.4, 0, 0, 0.6, 4, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Yeni Türk Edebiyatı IV', 5, 4, 0.4, 0, 0, 0.6, 4, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Türk Halk Edebiyatı IV', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Türk Dili IV', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Osmanlı Türkçesi IV', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Karşılaştırmalı Edebiyat', 3, 3, 0.4, 0.1, 0, 0.5, 4, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Eski Türk Edebiyatı V', 5, 4, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Yeni Türk Edebiyatı V', 5, 4, 0.4, 0.1, 0, 0.5, 5, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Türk Dili V', 4, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Batı Edebiyatı', 4, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Metin İnceleme Yöntemleri', 3, 3, 0.3, 0.3, 0.1, 0.3, 5, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Eski Türk Edebiyatı VI', 5, 4, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Yeni Türk Edebiyatı VI', 5, 4, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Türk Dili VI', 4, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Bitirme Çalışması I', 3, 3, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Seçmeli: Çağdaş Türk Şiiri', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Bitirme Çalışması II', 5, 5, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Türk Edebiyatı Semineri', 4, 4, 0.3, 0.3, 0.1, 0.3, 7, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Seçmeli: Çağdaş Türk Romanı', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Seçmeli: Hikaye ve Roman İncelemesi', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Bitirme Çalışması III', 6, 6, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Seçmeli: Çocuk Edebiyatı', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid, 'Seçmeli: Edebiyat ve Sinema', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = 'e3661e3f-f7f8-44dd-8e86-1793a77a06f7'::uuid LIMIT 1
);

-- === Uluslararasi Iliskiler (uluslararasi-iliskiler) — 41 ders ===
INSERT INTO department_courses
  (department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
SELECT v.* FROM (VALUES
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Uluslararası İlişkilere Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Siyaset Bilimine Giriş', 4, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Hukuk Başlangıcı', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Siyaset Tarihi I', 3, 3, 0.4, 0, 0, 0.6, 1, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Türk Dili I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Atatürk İlkeleri I', 2, 2, 0.4, 0, 0, 0.6, 1, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Uluslararası İlişkiler Kuramları', 5, 4, 0.4, 0, 0, 0.6, 2, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Karşılaştırmalı Siyaset', 4, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Siyaset Tarihi II', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Anayasa Hukuku', 3, 3, 0.4, 0, 0, 0.6, 2, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Türk Dili II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Atatürk İlkeleri II', 2, 2, 0.4, 0, 0, 0.6, 2, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Türk Dış Politikası I', 5, 4, 0.4, 0, 0, 0.6, 3, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Uluslararası Hukuk I', 5, 4, 0.4, 0, 0, 0.6, 3, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Uluslararası Örgütler', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Uluslararası Siyaset Ekonomisi', 4, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Diplomasi Tarihi', 3, 3, 0.4, 0, 0, 0.6, 3, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Türk Dış Politikası II', 5, 4, 0.4, 0, 0, 0.6, 4, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Uluslararası Hukuk II', 5, 4, 0.4, 0, 0, 0.6, 4, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Avrupa Birliği Politikaları', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Bölgesel Çalışmalar (Ortadoğu)', 4, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Uluslararası Güvenlik', 3, 3, 0.4, 0, 0, 0.6, 4, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Türk Dış Politikası III', 5, 4, 0.4, 0, 0, 0.6, 5, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Diplomasi ve Müzakere', 4, 4, 0.3, 0.3, 0.1, 0.3, 5, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Bölgesel Çalışmalar (Asya)', 4, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'İnsan Hakları', 3, 3, 0.4, 0, 0, 0.6, 5, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Araştırma Yöntemleri', 3, 3, 0.3, 0.3, 0, 0.4, 5, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Bitirme Çalışması I', 5, 5, 0, 0.4, 0.4, 0.2, 6, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Staj', 3, 0, 0, 0.5, 0.3, 0.2, 6, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Bölgesel Çalışmalar (Avrupa)', 4, 3, 0.4, 0, 0, 0.6, 6, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Seçmeli: Enerji Politikası', 3, 3, 0.4, 0.1, 0, 0.5, 6, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Seçmeli: Göç Politikaları', 3, 3, 0.4, 0.2, 0, 0.4, 6, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Bitirme Çalışması II', 6, 6, 0, 0.4, 0.4, 0.2, 7, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Bölgesel Çalışmalar (Amerika)', 4, 3, 0.4, 0, 0, 0.6, 7, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Seçmeli: Çevre Politikası', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Seçmeli: Çatışma Çözümü', 3, 3, 0.4, 0.2, 0, 0.4, 7, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Bitirme Çalışması III', 7, 8, 0, 0.4, 0.4, 0.2, 8, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Uluslararası İlişkiler Etik', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Meslek Etiği', 2, 2, 0.4, 0.2, 0, 0.4, 8, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Seçmeli: Dijital Diplomasi', 3, 3, 0.3, 0.3, 0.1, 0.3, 8, NULL),
  ('043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid, 'Seçmeli: Küreselleşme', 3, 3, 0.4, 0.2, 0, 0.4, 8, NULL)
) AS v(department_id, ad, kredi, ders_saati, vize_yuzde, odev_yuzde, proje_yuzde, final_yuzde, donem, legacy_id)
WHERE NOT EXISTS (
  SELECT 1 FROM department_courses dc WHERE dc.department_id = '043d2e3b-78eb-42f0-8881-4a7aa4d0685a'::uuid LIMIT 1
);

COMMIT;

-- ============================================================
-- Doğrulama sorguları
-- ============================================================
-- Toplam üniversite sayısı (beklenen: 30):
-- SELECT COUNT(*) FROM universities;

-- Toplam fakülte sayısı:
-- SELECT COUNT(*) FROM faculties;

-- Toplam department_courses sayısı (beklenen: ~2293):
-- SELECT COUNT(*) FROM department_courses;

-- Üniversite başına fakülte sayısı:
-- SELECT u.ad, COUNT(f.id) FROM universities u
-- LEFT JOIN faculties f ON f.university_id = u.id
-- GROUP BY u.ad ORDER BY u.ad;

-- legacy_id=0 kalmış mı kontrol (0 olmalı):
-- SELECT COUNT(*) FROM department_courses WHERE legacy_id = 0;