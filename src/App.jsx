import React, { useState, useRef, useCallback } from "react";

// ---- Design tokens ----
// bg #0A0E1A / panel #121729 / border #232B42 / glow-blue #4C8DFF
// text #F5F6FA / muted #8890A6 / orange #FF9F43 / green #2ECC71
const C = {
  bg: "#0A0E1A",
  panel: "#121729",
  border: "#232B42",
  blue: "#4C8DFF",
  text: "#F5F6FA",
  muted: "#8890A6",
  orange: "#FF9F43",
  green: "#2ECC71",
};

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const NAV_ITEMS = [
  { key: "history", label: "تاریخچه", icon: (p) => <path d="M12 8v4l3 2M21 12a9 9 0 1 1-9-9" {...p} /> },
  { key: "fav", label: "علاقه‌مندی‌ها", icon: (p) => <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 5a5.5 5.5 0 0 1 9.5 7c-2.5 4.5-9.5 9-9.5 9Z" {...p} /> },
  { key: "scan", label: "اسکن", icon: (p) => <><rect x="4" y="4" width="16" height="16" rx="4" {...p} /><circle cx="12" cy="12" r="3" {...p} /></> },
  { key: "alerts", label: "اعلان‌ها", icon: (p) => <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" {...p} /> },
  { key: "profile", label: "پروفایل", icon: (p) => <><circle cx="12" cy="8" r="3.5" {...p} /><path d="M5 20c1.5-4 5-5.5 7-5.5s5.5 1.5 7 5.5" {...p} /></> },
];

const BADGES = [
  { color: C.orange, label: "سریع و هوشمند", sub: "جستجوی آنی", icon: (p) => <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" {...p} /> },
  { color: C.green, label: "قابل اعتماد", sub: "منبع دیجی‌کالا و دیوار", icon: (p) => <path d="m9 12 2 2 4-4M12 3l8 3.5v5c0 5-3.5 8.5-8 9.5-4.5-1-8-4.5-8-9.5v-5L12 3Z" {...p} /> },
  { color: C.blue, label: "محافظت از حریم", sub: "اطلاعاتت پیش خودته", icon: (p) => <><rect x="5" y="11" width="14" height="9" rx="2" {...p} /><path d="M8 11V7a4 4 0 0 1 8 0v4" {...p} /></> },
];

export default function App() {
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState("idle");
  const [items, setItems] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const base64 = await fileToBase64(file);
    setImage({ base64, mediaType: file.type, previewUrl: URL.createObjectURL(file) });
    setItems([]);
    setStatus("idle");
    setErrorMsg("");
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const analyze = async () => {
    if (!image) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: image.base64, mediaType: image.mediaType }),
      });
      const raw = await response.text();
      if (!response.ok) {
        throw new Error(`(${response.status}) ${raw}`);
      }
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error(`پاسخ نامعتبر از سرور: ${raw.slice(0, 300)}`);
      }
      if (parsed.error) {
        throw new Error(parsed.error);
      }
      setItems(parsed.items || []);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "اسکن انجام نشد. دوباره امتحان کن.");
      setStatus("error");
    }
  };

  const reset = () => {
    setImage(null);
    setItems([]);
    setStatus("idle");
    setErrorMsg("");
  };

  const digikalaUrl = (q) => `https://www.digikala.com/search/?q=${encodeURIComponent(q)}`;
  const divarUrl = (q) => `https://divar.ir/s/iran?q=${encodeURIComponent(q)}`;

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: `radial-gradient(60% 40% at 50% 0%, #101830 0%, ${C.bg} 60%)`,
        color: C.text,
        fontFamily: "'Vazirmatn', 'Segoe UI', Tahoma, Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingBottom: 96,
      }}
    >
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');
        * { box-sizing: border-box; }

        .wordmark {
          background: linear-gradient(180deg, #FFFFFF 0%, #C9D6F5 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
          filter: drop-shadow(0 0 22px rgba(76,141,255,0.45));
        }
        .sparkle { animation: twinkle 2.4s ease-in-out infinite; transform-origin: center; }
        @keyframes twinkle { 0%,100% { opacity: .4; transform: scale(.85) rotate(0deg); } 50% { opacity: 1; transform: scale(1.15) rotate(15deg); } }

        .scan-box { position: relative; overflow: hidden; }
        .scan-beam {
          position: absolute; left: -10%; right: -10%; height: 46%;
          background: radial-gradient(closest-side, rgba(76,141,255,0.35), transparent 70%);
          filter: blur(2px);
          animation: beam 3.2s ease-in-out infinite;
        }
        @keyframes beam { 0% { top: -30%; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        .pulse-ring {
          position: absolute; inset: 0; margin: auto; width: 96px; height: 96px;
          border-radius: 50%; border: 1.5px solid rgba(76,141,255,0.55);
          animation: ring 2.6s ease-out infinite;
        }
        .pulse-ring.d2 { animation-delay: .9s; }
        @keyframes ring { 0% { transform: scale(.6); opacity: .9; } 100% { transform: scale(2.1); opacity: 0; } }
        .corner { position: absolute; width: 26px; height: 26px; border: 2.5px solid ${C.blue}; opacity: .9; }
        .corner.tl { top: 18px; left: 18px; border-right: none; border-bottom: none; border-top-right-radius: 6px; }
        .corner.tr { top: 18px; right: 18px; border-left: none; border-bottom: none; border-top-left-radius: 6px; }
        .corner.bl { bottom: 18px; left: 18px; border-right: none; border-top: none; border-bottom-right-radius: 6px; }
        .corner.br { bottom: 18px; right: 18px; border-left: none; border-top: none; border-bottom-left-radius: 6px; }
        .cam-glow { filter: drop-shadow(0 0 14px rgba(76,141,255,0.7)); }

        .primary-btn { transition: transform .15s ease, box-shadow .15s ease; }
        .primary-btn:hover { transform: translateY(-2px); }
        .primary-btn:active { transform: translateY(1px); }
        .store-link { transition: background .15s ease, border-color .15s ease; }
        .store-link:hover { border-color: ${C.blue}; background: rgba(76,141,255,0.08); }
        .nav-item { transition: color .15s ease, transform .15s ease; }
        .nav-item:hover { transform: translateY(-2px); }

        @media (prefers-reduced-motion: reduce) {
          .scan-beam, .pulse-ring, .sparkle { animation: none !important; }
          .primary-btn, .store-link, .nav-item { transition: none !important; }
        }
        .focusable:focus-visible { outline: 3px solid ${C.blue}; outline-offset: 2px; }
      `}</style>

      {/* Top bar */}
      <div style={{ width: "100%", maxWidth: 480, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 0" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.muted, fontWeight: 600 }}>
          دوقلو · اسکن
          <svg width="15" height="15" viewBox="0 0 24 24" fill={C.blue}>
            <path d="M12 2 14.5 8 21 9l-5 4.5 1.3 6.5L12 16.8 6.7 20l1.3-6.5L3 9l6.5-1Z" />
          </svg>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: C.panel, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2">
            <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9.5 4.5-1 8-4.5 8-9.5V6l-8-3Z" />
          </svg>
        </div>
      </div>

      {/* Header */}
      <header style={{ maxWidth: 480, width: "100%", textAlign: "center", margin: "26px 0 28px", padding: "0 20px" }}>
        <h1 className="wordmark" style={{ fontSize: "clamp(40px, 11vw, 58px)", margin: 0, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 10 }}>
          دوقلو
          <svg className="sparkle" width="26" height="26" viewBox="0 0 24 24" fill={C.blue}>
            <path d="M12 2 14.5 8 21 9l-5 4.5 1.3 6.5L12 16.8 6.7 20l1.3-6.5L3 9l6.5-1Z" />
          </svg>
        </h1>
        <p style={{ marginTop: 12, fontSize: 15, color: C.muted, lineHeight: 1.9 }}>
          عکس هر چیزی که دوست داری بگیر
          <br />
          دوقلوی ارزون‌ترش رو تو دیجی‌کالا و دیوار پیدا کن
        </p>
      </header>

      {/* Scan card */}
      <div style={{ width: "100%", maxWidth: 480, padding: "0 20px" }}>
        <div
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 22,
            padding: 18,
          }}
        >
          {!image && (
            <div
              className="scan-box"
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1/1",
                borderRadius: 16,
                background: dragOver ? "rgba(76,141,255,0.08)" : "#0D1220",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                cursor: "pointer",
              }}
            >
              <div className="scan-beam" aria-hidden="true" />
              <div className="pulse-ring" aria-hidden="true" />
              <div className="pulse-ring d2" aria-hidden="true" />
              <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />

              <svg className="cam-glow" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.6" style={{ position: "relative", zIndex: 1 }}>
                <path d="M4 8V6a2 2 0 0 1 2-2h2M20 8V6a2 2 0 0 0-2-2h-2M4 16v2a2 2 0 0 0 2 2h2M20 16v2a2 2 0 0 1-2 2h-2" />
                <circle cx="12" cy="12" r="3.4" />
              </svg>
              <div style={{ position: "relative", zIndex: 1, fontSize: 16, fontWeight: 700 }}>عکس رو پخش اینجا</div>
              <div style={{ position: "relative", zIndex: 1, fontSize: 13, color: C.muted }}>یا کلیک کن تا عکس انتخاب کنی</div>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0])}
                className="focusable"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", zIndex: 2 }}
              />
            </div>
          )}

          {image && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "100%", borderRadius: 16, overflow: "hidden", position: "relative" }}>
                <img src={image.previewUrl} alt="عکس آپلود شده" style={{ width: "100%", display: "block" }} />
                {status === "loading" && <div className="scan-beam" aria-hidden="true" />}
              </div>

              {status !== "done" && (
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button
                    className="primary-btn focusable"
                    onClick={analyze}
                    disabled={status === "loading"}
                    style={{
                      background: `linear-gradient(180deg, ${C.blue}, #2F6FE0)`,
                      color: "#fff",
                      border: "none",
                      borderRadius: 999,
                      padding: "13px 30px",
                      fontSize: 15,
                      fontWeight: 800,
                      cursor: status === "loading" ? "default" : "pointer",
                      opacity: status === "loading" ? 0.75 : 1,
                      boxShadow: "0 6px 20px rgba(76,141,255,0.35)",
                    }}
                  >
                    {status === "loading" ? "در حال اسکن…" : "پیدا کن دوقلوشو"}
                  </button>
                  <button
                    className="primary-btn focusable"
                    onClick={reset}
                    style={{ background: "transparent", color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 999, padding: "13px 24px", fontSize: 15, cursor: "pointer" }}
                  >
                    عکس دیگه
                  </button>
                </div>
              )}
              {status === "error" && <div style={{ color: C.orange, fontSize: 14, marginTop: 10 }}>{errorMsg}</div>}
            </div>
          )}
        </div>

        {/* Feature badges */}
        {!image && (
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {BADGES.map((b, i) => (
              <div key={i} style={{ flex: 1, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={b.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {b.icon({})}
                </svg>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>{b.label}</div>
                <div style={{ fontSize: 10.5, color: C.muted }}>{b.sub}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {status === "done" && (
        <div style={{ width: "100%", maxWidth: 480, marginTop: 28, padding: "0 20px" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", color: C.muted, padding: "24px 0" }}>
              چیزی برای اسکن پیدا نشد. یه عکس واضح‌تر امتحان کن.
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12.5, letterSpacing: "0.15em", color: C.blue, fontWeight: 700, marginBottom: 14, textAlign: "center" }}>
                {items.length} آیتم پیدا شد
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {items.map((item, i) => (
                  <div key={i} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800 }}>{item.name}</div>
                        <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>{item.style_note}</div>
                      </div>
                      <div style={{ fontSize: 12.5, color: C.blue, fontWeight: 700, whiteSpace: "nowrap" }}>
                        ~${item.estimated_price_low}–{item.estimated_price_high}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      <a className="store-link focusable" href={digikalaUrl(item.search_query)} target="_blank" rel="noopener noreferrer"
                         style={{ flex: 1, textAlign: "center", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, color: C.text, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
                        جستجو در دیجی‌کالا
                      </a>
                      <a className="store-link focusable" href={divarUrl(item.search_query)} target="_blank" rel="noopener noreferrer"
                         style={{ flex: 1, textAlign: "center", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, color: C.text, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
                        جستجو در دیوار
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11.5, color: C.muted, marginTop: 16, textAlign: "center", lineHeight: 1.8 }}>
                قیمت‌ها تخمینی برای نسخه اصلی هستن. برای دوقلوی واقعی، رو دکمه‌های بالا بزن.
              </p>
              <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                <button className="primary-btn focusable" onClick={reset}
                  style={{ background: "transparent", color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 999, padding: "10px 24px", fontSize: 14, cursor: "pointer" }}>
                  عکس بعدی
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Bottom nav */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(10,14,26,0.92)",
          backdropFilter: "blur(10px)",
          borderTop: `1px solid ${C.border}`,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 480, display: "flex", justifyContent: "space-between", padding: "10px 22px 14px" }}>
          {NAV_ITEMS.map((n) => {
            const active = n.key === "scan";
            return (
              <div key={n.key} className="nav-item" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: active ? C.blue : C.muted, cursor: "pointer" }}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? C.blue : C.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {n.icon({})}
                </svg>
                <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{n.label}</span>
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
