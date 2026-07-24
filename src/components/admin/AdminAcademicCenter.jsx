import { useState } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import AdminClasses from "./AdminClasses";
import AdminUniversities from "./AdminUniversities";

export default function AdminAcademicCenter({ onUserSelect }) {
  const { tokens } = useTheme();
  const [section, setSection] = useState("classes");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <section
        style={{
          background: tokens.card,
          border: `1px solid ${tokens.border}`,
          borderRadius: 8,
          padding: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, color: tokens.textPrimary, fontSize: 18, fontWeight: 800 }}>Akademik Veri Merkezi</h2>
            <p style={{ margin: "4px 0 0", color: tokens.textSecondary, fontSize: 12 }}>
              Sınıf, üniversite, fakülte, bölüm ve ders bağlantıları tek çalışma alanında.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              ["classes", "Sınıflar"],
              ["universities", "Üniversiteler"],
            ].map(([id, label]) => {
              const active = section === id;
              return (
                <button
                  key={id}
                  onClick={() => setSection(id)}
                  style={{
                    height: 34,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: `1px solid ${active ? tokens.primary : tokens.border}`,
                    background: active ? `${tokens.primary}18` : tokens.surface,
                    color: active ? tokens.primary : tokens.textSecondary,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {section === "classes" ? (
        <AdminClasses onUserSelect={onUserSelect} />
      ) : (
        <AdminUniversities />
      )}
    </div>
  );
}
