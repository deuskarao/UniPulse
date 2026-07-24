# UniPulse Rate Limit ve DDoS Koruması

## Kod İçinde Aktif Koruma

- Supabase Auth config içinde sign-in/sign-up, e-posta ve token doğrulama limitleri sıkıdır.
- Doğrudan Supabase signup kapalıdır; hesap oluşturma `request-registration` ve `confirm-registration` Edge Function akışından geçer.
- `request-registration`, `confirm-registration` ve `demo-login` fonksiyonları Supabase `security_rate_limits` tablosundaki kalıcı limitleri kullanır.
- Rate limit anahtarları hash'lenerek saklanır; e-posta, IP veya token açık metin olarak tabloya yazılmaz.
- Demo girişte şifre ön yüzde tutulmaz; Edge Function tek kullanımlık giriş linki üretir.
- Edge Function CORS ayarı production origin ve local geliştirme adresleriyle sınırlandırılmıştır.

## Önerilen Edge/WAF Kuralları

Uygulama kodu Supabase fonksiyonlarındaki brute-force ve token taramasını keser. Büyük hacimli DDoS için Vercel veya Cloudflare WAF gerekir.

### Vercel

- UniPulse web domaininde `/` ve statik dosyalar için Vercel'in platform DDoS korumasını kullan.
- Eğer Supabase fonksiyonları custom domain arkasına alınırsa `/functions/v1/*` için IP başına `60 istek / dakika` kuralı aç.
- Auth callback ve magic link doğrulama yolları için daha sıkı challenge/rate limit kullan.

### Cloudflare

- Production domain proxied çalışsın.
- Custom domain üzerinden Supabase Function çağrısı yapılırsa `/functions/v1/*` için rate limiting rule aç.
- Managed Challenge veya Block aksiyonu kullan.
- Bot Fight Mode / WAF managed rules aktif tut.

## Not

Supabase'in kendi domainine doğrudan gelen trafiği Cloudflare kuralları görmez. Supabase Edge Function limitleri bu yüzden veritabanı seviyesinde de tutulur. Mobil uygulama aynı Supabase/Auth/Function endpointlerini kullandığı için bu korumalardan etkilenir.
