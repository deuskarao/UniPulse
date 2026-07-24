# UniPulse

Üniversite not takip sistemi. Öğrenciler bölümlerine göre derslerini görüntüleyebilir, notlarını girebilir ve GANO hesaplayabilir. Admin paneli üzerinden tüm kullanıcılar yönetilebilir.

**Canlı Demo:** [https://unipulse.perainc.online](https://unipulse.perainc.online)

## Deneme

Siteyi test etmek için:

1. [https://unipulse.perainc.online](https://unipulse.perainc.online) adresine git
2. **Kayıt Ol** — email ve şifre ile yeni bir hesap oluştur
3. Fakülte ve bölüm seçimi yap
4. Derslere not gir, GANO hesapla
## Proje Yapısı

```
UniPulse/
├── .github/workflows/          # CI/CD - GitHub Pages deploy
├── src/
│   ├── components/
│   │   ├── admin/              # Admin paneli bileşenleri (Layout, Dashboard, Users vb.)
│   │   ├── AuthPage.jsx        # Giriş/Kayıt ekranı
│   │   ├── DepartmentSelector.jsx # Fakülte/Bölüm seçim sihirbazı
│   │   └── ...                 # Grafikler, hata yakalayıcı (ErrorBoundary) ve ortak bileşenler
│   ├── context/
│   │   ├── AuthContext.jsx     # Kullanıcı yetkilendirme (Auth) state'i
│   │   └── I18nContext.jsx     # Çoklu dil (i18n) yönetimi
│   ├── hooks/
│   │   └── useDersler.js       # Ders işlemleri (CRUD) ve hesaplamalar (GANO vb.)
│   ├── layout/
│   │   └── MainLayout.jsx      # Sidebar, Header ve Ana içerik kapsayıcısı
│   ├── lib/
│   │   └── supabase.js         # Supabase client ve bağlantı ayarları
│   ├── locales/
│   │   ├── tr.json, en.json... # Çeviri dosyaları (TR, EN, RU, ES, IT)
│   ├── pages/
│   │   ├── DashboardPage.jsx   # Ana özet ekranı
│   │   ├── CoursesPage.jsx     # Dersler ve not giriş ekranı
│   │   ├── MyClassPage.jsx     # Sınıf, Bölüm ve Okul Liderlik tabloları
│   │   └── TranscriptPage.jsx  # Transkript (geçmiş dönemler)
│   ├── theme/
│   │   └── ThemeProvider.jsx   # Tema yönetimi ve renk token'ları
│   ├── App.jsx                 # Ana uygulama rotaları (Router)
│   ├── index.css               # Global CSS stilleri
│   └── main.jsx                # React root
├── sql/
│   └── production_ready.sql    # Veritabanı tabloları, RLS ve fonksiyonlar
├── index.html
├── package.json
└── README.md
```

## Özellikler

- **Supabase Auth** — email/şifre ile giriş/kayıt
- **Bölüm Seçimi** — fakülte bazlı 2 aşamalı seçim (fakülte → bölüm)
- **Dashboard** — ders listesi, vize/ödev/final not girişi, harf notu hesaplama, GANO, kredi takibi
- **Ders Yönetimi** — ders ekleme/düzenleme/silme, dönem/kredi/ağırlık ayarlama
- **Admin Paneli** — tüm kullanıcıları görüntüleme, not düzenleme, bilgi güncelleme, kullanıcı silme
- **Responsive** — mobil ve masaüstü uyumlu
- **Dark tema** — modern arayüz
- **DB-Driven** — harf notları, renkler, GANO eşikleri, fakülte-bölüm eşlemeleri tamamı veritabanından

## Kurulum

```bash
git clone https://github.com/deuskarao/UniPulse.git
cd UniPulse
npm install
```

### Ortam Değişkenleri

`.env` dosyası oluştur:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

### Geliştirme

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Veritabanı

Supabase SQL Editor'da `sql/production_ready.sql` dosyasını çalıştır. Bu dosya şunları oluşturur:

- **Tablolar:** departments, profiles, department_courses, student_grades, harf_notlari, harf_renkler, gano_renkler, default_course, faculties, faculty_departments
- **RLS Policies:** Her tablo için role-bazlı erişim kontrolü
- **RPC'ler:** select_department, update_user_email, delete_user
- **Trigger'lar:** handle_new_user (kayıt otomatik profil), touch_updated_at
- **Seed Data:** Harf notları, renkler, GANO eşikleri, fakülte-bölüm eşlemeleri

## CI/CD

Her push'da GitHub Actions otomatik build edip GitHub Pages'a deploy eder.

- Build'de `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` ve `VITE_GOOGLE_CLIENT_ID` GitHub Secrets/Variables üzerinden alınır
- Deploy `actions/deploy-pages` ile yapılır

## Teknolojiler

- React 19 + Vite 8
- Supabase (Auth + PostgreSQL + RLS)
- GitHub Actions CI/CD
- GitHub Pages

## Lisans

MIT

## Yasal Uyarı (Disclaimer)

**Önemli Not:** Bu proje içerisinde yer alan ders içerikleri, notlandırma sistemleri, üniversite/fakülte/bölüm hiyerarşisi ve diğer akademik veriler sadece örnek teşkil etmesi amacıyla kullanılmıştır. 

Kullanıcıların bu platforma girdiği verilerin ve platform içerisindeki altyapı verilerinin (ders programları, içerikler vb.) **kopyalanması, izinsiz dağıtılması veya ticari amaçlarla kullanılması kesinlikle yasaktır.** Kullanıcılar, sisteme girdikleri verilerin doğruluğundan ve gizliliğinden kendileri sorumludur. Eğitim kurumlarına ait olabilecek tescilli verilerin izinsiz kullanımı durumunda sorumluluk tamamen kullanıcıya aittir.
