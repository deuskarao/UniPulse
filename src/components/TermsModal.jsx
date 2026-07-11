import { motion, AnimatePresence } from "framer-motion";

export default function TermsModal({ isOpen, onClose, type, tokens, isDark, onApprove, onDecline }) {
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
              {type === 'terms' ? 'Kullanım Koşulları' : 'KVKK Aydınlatma Metni'}
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
                <h3 style={{ color: tokens.textPrimary, fontSize: 15, fontWeight: 600, margin: "0 0 10px" }}>1. Genel Koşullar</h3>
                <p>UniPulse platformuna kayıt olarak aşağıdaki kullanım koşullarını kabul etmiş sayılırsınız. Platform, üniversite öğrencilerine akademik takip ve analiz hizmeti sunmak amacıyla geliştirilmiştir.</p>
                <p>Kullanıcılar, hesap bilgilerinin gizliliğinden sorumludur. Şifrenizi üçüncü kişilerle paylaşmayınız. Hesabınızda gerçekleşen tüm işlemlerden siz sorumlusunuz.</p>
                <h3 style={{ color: tokens.textPrimary, fontSize: 15, fontWeight: 600, margin: "16px 0 10px" }}>3. Veri Kullanımı</h3>
                <p>Platforma girdiğiniz akademik veriler (ders notları, GPA bilgileri vb.) yalnızca size özel analiz ve raporlama amacıyla kullanılır. Verileriniz üçüncü taraflarla paylaşılmaz.</p>
                <h3 style={{ color: tokens.textPrimary, fontSize: 15, fontWeight: 600, margin: "16px 0 10px" }}>4. Hizmet Sınırları</h3>
                <p>UniPulse, sunduğu hizmetleri önceden bildirimde bulunmaksızın değiştirme, askıya alma veya sonlandırma hakkını saklı tutar. Platform "olduğu gibi" sunulmakta olup herhangi bir garanti verilmemektedir.</p>
                <h3 style={{ color: tokens.textPrimary, fontSize: 15, fontWeight: 600, margin: "16px 0 10px" }}>5. Fikri Mülkiyet</h3>
                <p>UniPulse platformundaki tüm tasarım, logo, yazılım ve içerikler telif hakkı ile korunmaktadır. İzinsiz kopyalama, dağıtma veya ticari amaçla kullanma yasaktır.</p>
                <h3 style={{ color: tokens.textPrimary, fontSize: 15, fontWeight: 600, margin: "16px 0 10px" }}>6. İletişim</h3>
                <p>Kullanım koşullarıyla ilgili sorularınız için <strong style={{ color: tokens.textPrimary }}>destek@unipulse.app</strong> adresinden bizimle iletişime geçebilirsiniz.</p>
              </>
            ) : (
              <>
                <h3 style={{ color: tokens.textPrimary, fontSize: 15, fontWeight: 600, margin: "0 0 10px" }}>Veri Sorumlusu</h3>
                <p>UniPulse platformu olarak kişisel verilerinizin korunmasına büyük önem veriyoruz. 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında aşağıdaki bilgilendirmeyi sunarız.</p>
                <h3 style={{ color: tokens.textPrimary, fontSize: 15, fontWeight: 600, margin: "16px 0 10px" }}>İşlenen Kişisel Veriler</h3>
                <p>Kimlik bilgileri (ad, soyad, kullanıcı adı), iletişim bilgileri (e-posta adresi), eğitim bilgileri (üniversite, fakülte, bölüm, ders notları, GPA), hesap güvenlik bilgileri (şifrelenmiş parola, oturum verileri).</p>
                <h3 style={{ color: tokens.textPrimary, fontSize: 15, fontWeight: 600, margin: "16px 0 10px" }}>Verilerin İşlenme Amacı</h3>
                <p>Toplanan veriler; üyelik işlemlerinin yürütülmesi, akademik performans analizi ve raporlama, platform güvenliğinin sağlanması ve kullanıcı deneyiminin iyileştirilmesi amacıyla işlenmektedir.</p>
                <h3 style={{ color: tokens.textPrimary, fontSize: 15, fontWeight: 600, margin: "16px 0 10px" }}>Verilerin Aktarılması</h3>
                <p>Kişisel verileriniz, yasal zorunluluklar dışında üçüncü taraflarla paylaşılmaz. Verileriniz Supabase altyapısı üzerinde şifreli olarak saklanmaktadır.</p>
                <h3 style={{ color: tokens.textPrimary, fontSize: 15, fontWeight: 600, margin: "16px 0 10px" }}>Haklarınız</h3>
                <p>KVKK'nın 11. maddesi uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini isteme, silinmesini veya yok edilmesini isteme, üçüncü kişilere aktarılıp aktarılmadığını öğrenme haklarına sahipsiniz.</p>
                <h3 style={{ color: tokens.textPrimary, fontSize: 15, fontWeight: 600, margin: "16px 0 10px" }}>İletişim</h3>
                <p>KVKK kapsamındaki taleplerinizi <strong style={{ color: tokens.textPrimary }}>kvkk@unipulse.app</strong> adresine iletebilirsiniz.</p>
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
            >Vazgeç</motion.button>
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
            >Onaylıyorum</motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
