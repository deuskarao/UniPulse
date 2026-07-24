# UniPulse Proje Yapısı

- `src/App.jsx`: Oturum, bölüm seçimi ve ana uygulama akışı.
- `src/components`: Ortak UI parçaları, auth ekranı ve admin bileşenleri.
- `src/context`: Auth, uygulama verisi ve dil sağlayıcıları.
- `src/hooks`: Ders, GPA ve akademik hesaplama veri akışları.
- `src/pages`: Admin, bölüm, sınıf, ayarlar gibi ana ekranlar.
- `src/utils`: Client loglama ve küçük yardımcılar.
- `src/locales`: Dil dosyaları.
- `supabase`: Edge functions, migrations ve Supabase konfigürasyonu.
- `public`: Sitemap, robots, logo ve preview gibi statik dosyalar.

Notlar:
- `node_modules`, `dist`, `logs`, `.DS_Store` ve geçici cache dosyaları kaynak değildir.
- Client hata/şüpheli URL logları `src/utils/clientLogger.js` üzerinden yönetilir.
