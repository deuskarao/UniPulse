import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminNotes({ userId, showToast, logAction }) {
  const { tokens } = useTheme();
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [editContent, setEditContent] = useState("");

  const fetchNotes = useCallback(async () => {
    if (!userId) { setNotes([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_notes")
      .select("*, profiles!admin_notes_admin_id_fkey(full_name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) setNotes(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function addNote() {
    if (!newNote.trim() || !userId) return;
    const { data, error } = await supabase
      .from("admin_notes")
      .insert({
        user_id: userId,
        admin_id: user?.id,
        content: newNote.trim(),
      })
      .select("*, profiles!admin_notes_admin_id_fkey(full_name)")
      .single();
    if (!error && data) {
      setNotes(prev => [data, ...prev]);
      setNewNote("");
      showToast("Not eklendi");
      logAction("note_added", { user_id: userId, content: newNote.trim() });
    }
  }

  async function updateNote(noteId) {
    if (!editContent.trim()) return;
    const { error } = await supabase
      .from("admin_notes")
      .update({ content: editContent.trim(), updated_at: new Date().toISOString() })
      .eq("id", noteId);
    if (!error) {
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: editContent.trim(), updated_at: new Date().toISOString() } : n));
      setEditingNote(null);
      setEditContent("");
      showToast("Not güncellendi");
    }
  }

  async function deleteNote(noteId) {
    const { error } = await supabase
      .from("admin_notes")
      .delete()
      .eq("id", noteId);
    if (!error) {
      setNotes(prev => prev.filter(n => n.id !== noteId));
      showToast("Not silindi");
      logAction("note_deleted", { note_id: noteId });
    }
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: tokens.card,
        border: `1px solid ${tokens.border}`,
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ padding: "14px 16px", borderBottom: `1px solid ${tokens.border}` }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary }}>Admin Notları</span>
        <span style={{ fontSize: 11, color: tokens.muted }}>{notes.length} not</span>
      </div>

      {userId && (
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${tokens.border}` }}>
          <textarea
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Yeni not ekle..."
            rows={2}
            className="w-full rounded-lg px-3 py-2 text-xs outline-none resize-none"
            style={{
              background: tokens.input,
              border: `1px solid ${tokens.border}`,
              color: tokens.textPrimary,
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={addNote}
            disabled={!newNote.trim()}
            className="w-full mt-2 rounded-lg py-2 text-xs font-semibold transition-colors duration-150"
            style={{
              background: newNote.trim() ? tokens.primary : tokens.border,
              color: newNote.trim() ? "#fff" : tokens.muted,
              border: "none",
              cursor: newNote.trim() ? "pointer" : "not-allowed",
            }}
          >
            Not Ekle
          </button>
        </div>
      )}

      <div style={{ maxHeight: 280, overflowY: "auto" }}>
        {!userId ? (
          <div className="text-center py-8" style={{ color: tokens.muted, fontSize: 12 }}>
            Kullanıcı seçin
          </div>
        ) : loading ? (
          <div className="text-center py-8" style={{ color: tokens.muted, fontSize: 12 }}>Yükleniyor...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8" style={{ color: tokens.muted, fontSize: 12 }}>Henüz not yok</div>
        ) : (
          notes.map(note => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="transition-colors duration-150"
              style={{
                padding: "12px 16px",
                borderBottom: `1px solid ${tokens.border}`,
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = tokens.sidebarHover}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              {editingNote === note.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg px-3 py-2 text-xs outline-none resize-none"
                    style={{
                      background: tokens.input,
                      border: `1px solid ${tokens.border}`,
                      color: tokens.textPrimary,
                      fontFamily: "inherit",
                    }}
                  />
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => { setEditingNote(null); setEditContent(""); }}
                      className="rounded px-2 py-1 text-xs"
                      style={{ border: `1px solid ${tokens.border}`, background: "transparent", color: tokens.muted, cursor: "pointer" }}
                    >
                      İptal
                    </button>
                    <button
                      onClick={() => updateNote(note.id)}
                      className="rounded px-2 py-1 text-xs font-semibold"
                      style={{ background: tokens.primary, color: "#fff", border: "none", cursor: "pointer" }}
                    >
                      Kaydet
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: tokens.textPrimary, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                    {note.content}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span style={{ fontSize: 10, color: tokens.muted }}>
                      {note.profiles?.full_name || "Admin"} · {new Date(note.created_at).toLocaleDateString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditingNote(note.id); setEditContent(note.content); }}
                        className="rounded px-1.5 py-0.5"
                        style={{ background: "transparent", border: "none", color: tokens.muted, cursor: "pointer", fontSize: 10 }}
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="rounded px-1.5 py-0.5"
                        style={{ background: "transparent", border: "none", color: tokens.danger, cursor: "pointer", fontSize: 10 }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
