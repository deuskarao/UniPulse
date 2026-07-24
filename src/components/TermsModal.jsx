import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../context/I18nContext";

export default function TermsModal({ isOpen, onClose, type, tokens, isDark, onApprove, onDecline }) {
  const { t } = useI18n();
  const terms = [
    ["1. Hizmetin kapsamı", "UniPulse; ders, kredi, harf notu, GANO, dönem takibi, hedef GANO ve liderlik tablosu gibi akademik takip araçları sunar. Platform resmi üniversite sistemi değildir; akademik kararlar için okulunuzun resmi kayıtları esas alınır."],
    ["2. Hesap güvenliği", "Kullanıcı adı, e-posta ve şifre güvenliğinden kullanıcı sorumludur. Hesabınızda şüpheli işlem fark ederseniz destek ekibiyle iletişime geçmeniz gerekir."],
    ["3. Veri doğruluğu", "GANO ve kredi hesaplamaları kullanıcının girdiği ders ve not verilerine göre yapılır. Hatalı girilen ders, kredi veya harf notu bilgilerinden doğabilecek sonuçlardan UniPulse sorumlu değildir."],
    ["4. Kullanım kuralları", "Platformu hukuka aykırı, yanıltıcı, başkalarının verilerine erişmeye yönelik veya hizmet güvenliğini bozacak şekilde kullanamazsınız."],
    ["5. Hizmet değişiklikleri", "UniPulse özellikleri, hesaplama yöntemleri ve hizmet kapsamı kullanıcı deneyimi, teknik gereklilikler veya yasal yükümlülükler nedeniyle güncellenebilir."],
    ["6. Hesap silme", "Hesap silme talebiniz onaylandığında profiliniz ve akademik verileriniz kalıcı olarak silinir. Yasal saklama zorunluluğu bulunan teknik kayıtlar ilgili süre boyunca saklanabilir."],
    ["7. İletişim", "Kullanım koşullarıyla ilgili taleplerinizi destek@unipulse.app adresine iletebilirsiniz."],
  ];
  const kvkk = [
    ["1. Veri sorumlusu", "UniPulse hizmeti kapsamında kişisel verileriniz, UniPulse uygulamasını işleten hizmet sağlayıcı tarafından 6698 sayılı KVKK uyarınca veri sorumlusu sıfatıyla işlenir."],
    ["2. İşlenen veriler", "Kimlik ve iletişim bilgileriniz, hesap güvenliği verileriniz, üniversite/bölüm/sınıf tercihleriniz, ders, kredi, harf notu, GANO ve uygulama kullanım kayıtlarınız işlenebilir."],
    ["3. İşleme amaçları", "Üyelik oluşturma, oturum açma, e-posta doğrulama, şifre sıfırlama, akademik takip ve raporlama, liderlik tablolarının oluşturulması, güvenlik, destek ve yasal yükümlülüklerin yerine getirilmesi amaçlanır."],
    ["4. Hukuki sebep ve yöntem", "Verileriniz elektronik formlar, uygulama içi işlemler ve oturum kayıtlarıyla; sözleşmenin kurulması/ifası, hukuki yükümlülük, meşru menfaat ve gerekli hallerde açık rıza sebeplerine dayanarak toplanır."],
    ["5. Aktarım ve saklama", "Veriler; barındırma, kimlik doğrulama, e-posta ve teknik destek hizmet sağlayıcılarıyla hizmetin gerektirdiği ölçüde paylaşılabilir. Veriler amaç için gerekli süre boyunca saklanır, ardından silinir veya anonimleştirilir."],
    ["6. Haklarınız", "KVKK madde 11 kapsamında verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltme, silme/yok etme, aktarım yapılan kişileri öğrenme, itiraz etme ve zararın giderilmesini isteme haklarına sahipsiniz."],
    ["7. Başvuru", "KVKK kapsamındaki taleplerinizi kvkk@unipulse.app adresine iletebilirsiniz. Başvurular mevzuatta öngörülen sürelerde sonuçlandırılır."],
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: isDark ? "rgba(7, 11, 20, 0.7)" : "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: 20,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%", maxWidth: 500, maxHeight: "85vh",
            background: isDark ? "rgba(15, 22, 35, 0.85)" : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)",
            borderRadius: 24, border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)",
            padding: "24px 28px", boxShadow: isDark ? "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 80px rgba(37,99,235,0.08)" : "0 25px 50px -12px rgba(0,0,0,0.1)",
            display: "flex", flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: tokens.textPrimary, letterSpacing: -0.3 }}>
              {type === 'terms' ? t('Kullanım Koşulları') : t('KVKK Aydınlatma Metni')}
            </h2>
            <button onClick={onClose} style={{
              background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", 
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
              color: tokens.muted, borderRadius: 8, width: 30, height: 30,
              cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "inherit", transition: "all 0.2s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = tokens.textPrimary; e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = tokens.muted; e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"; }}
            >✕</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", fontSize: 13, color: tokens.textSecondary, lineHeight: 1.7, paddingRight: 8 }}>
            {type === 'terms' ? (
              <>
                {terms.map(([title, body], index) => (
                  <div key={title}>
                    <h3 style={{ color: tokens.textPrimary, fontSize: 15, fontWeight: 600, margin: index === 0 ? "0 0 10px" : "16px 0 10px" }}>{title}</h3>
                    <p>{body}</p>
                  </div>
                ))}
              </>
            ) : (
              <>
                {kvkk.map(([title, body], index) => (
                  <div key={title}>
                    <h3 style={{ color: tokens.textPrimary, fontSize: 15, fontWeight: 600, margin: index === 0 ? "0 0 10px" : "16px 0 10px" }}>{title}</h3>
                    <p>{body}</p>
                  </div>
                ))}
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <motion.button
              onClick={onDecline}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                flex: 1, height: 44, borderRadius: 12,
                background: "transparent",
                border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(0,0,0,0.15)",
                color: tokens.textPrimary, cursor: "pointer", fontWeight: 600, fontSize: 13.5,
                fontFamily: "inherit",
              }}
            >{t("Vazgeç")}</motion.button>
            <motion.button
              onClick={onApprove}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                flex: 1, height: 44, borderRadius: 12, border: "none",
                background: tokens.primary,
                color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13.5,
                fontFamily: "inherit", boxShadow: `0 8px 20px ${isDark ? "rgba(37,99,235,0.32)" : "rgba(37,99,235,0.2)"}`,
              }}
            >{t("Onaylıyorum")}</motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
