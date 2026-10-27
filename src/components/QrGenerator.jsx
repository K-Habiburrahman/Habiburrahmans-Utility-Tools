import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

const DEFAULTS = { text: "https://example.com", fg: "#8b2c3d", bg: "#ffffff", size: 320 };
const SWATCHES = [
  { cls: "swatch-dark", fg: "#8b2c3d", bg: "#ffffff", label: "Burgundy theme" },
  { cls: "swatch-purple", fg: "#211b20", bg: "#f4e9e4", label: "Midnight theme" },
  { cls: "swatch-green", fg: "#516345", bg: "#f4f7ef", label: "Forest theme" },
  { cls: "swatch-pink", fg: "#8b2c3d", bg: "#fff4f5", label: "Rose theme" },
  { cls: "swatch-blue", fg: "#80601e", bg: "#fffdf5", label: "Gold theme" },
];

async function paintQr(canvas, { text, fg, bg, size, logo }) {
  await QRCode.toCanvas(canvas, text, {
    width: size,
    margin: 0,
    errorCorrectionLevel: "H",
    color: { dark: fg, light: bg },
  });
  if (!logo) return;
  const ctx = canvas.getContext("2d");
  const logoSize = Math.round(size * 0.19);
  const pad = Math.round(size * 0.025);
  const x = Math.round((size - logoSize) / 2);
  const plate = logoSize + pad * 2;
  const plateX = Math.round((size - plate) / 2);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(plateX, plateX, plate, plate, Math.max(4, size * 0.018));
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, x, logoSize, logoSize, Math.max(3, size * 0.012));
  ctx.clip();
  ctx.drawImage(logo, x, x, logoSize, logoSize);
  ctx.restore();
}

export default function QrGenerator({ id, hidden }) {
  const [text, setText] = useState(DEFAULTS.text);
  const [fg, setFg] = useState(DEFAULTS.fg);
  const [bg, setBg] = useState(DEFAULTS.bg);
  const [size, setSize] = useState(DEFAULTS.size);
  const [logo, setLogo] = useState(null); // { image, name }
  const [activeSwatch, setActiveSwatch] = useState(0);
  const [notice, setNotice] = useState({ msg: "", error: false });
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const logoUrlRef = useRef(null);

  const say = (msg, error = false) => setNotice({ msg, error });
  const trimmed = text.trim();

  // Live preview (debounced)
  useEffect(() => {
    if (!trimmed) {
      say("Enter some text or a URL first.", true);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        await paintQr(canvasRef.current, { text: trimmed, fg, bg, size, logo: logo?.image });
        say("QR code generated successfully.");
      } catch (err) {
        console.error(err);
        say("Could not generate this QR code. Try shorter text.", true);
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [trimmed, fg, bg, size, logo]);

  useEffect(() => () => logoUrlRef.current && URL.revokeObjectURL(logoUrlRef.current), []);

  const clearLogo = () => {
    if (logoUrlRef.current) URL.revokeObjectURL(logoUrlRef.current);
    logoUrlRef.current = null;
    if (fileRef.current) fileRef.current.value = "";
    setLogo(null);
  };

  const onLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      say("Choose a PNG, JPG, or WebP image.", true);
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      say("Logo must be smaller than 5 MB.", true);
      e.target.value = "";
      return;
    }
    if (logoUrlRef.current) URL.revokeObjectURL(logoUrlRef.current);
    const url = URL.createObjectURL(file);
    logoUrlRef.current = url;
    const image = new Image();
    image.onload = () => {
      setLogo({ image, name: file.name });
      say("Logo added. Download to include it in the QR code.");
    };
    image.onerror = () => say("That image could not be opened.", true);
    image.src = url;
  };

  const download = async () => {
    if (!trimmed) {
      say("Enter some text or a URL first.", true);
      return;
    }
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      await paintQr(canvas, { text: trimmed, fg, bg, size, logo: logo?.image });
      const a = document.createElement("a");
      a.download = `qr-code-${Date.now()}.png`;
      a.href = canvas.toDataURL("image/png");
      document.body.appendChild(a);
      a.click();
      a.remove();
      say("PNG downloaded. Test-scan it before printing.");
    } catch (err) {
      console.error(err);
      say("Download failed. Please try again.", true);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setText(DEFAULTS.text);
    setFg(DEFAULTS.fg);
    setBg(DEFAULTS.bg);
    setSize(DEFAULTS.size);
    setActiveSwatch(0);
    clearLogo();
    say("Settings reset.");
  };

  const pct = ((size - 180) / (600 - 180)) * 100;

  return (
    <section id={id} className="tool-panel qr-tool-panel tab-pane" role="tabpanel" aria-labelledby={`${id}-tab`} hidden={hidden}>
      <section className="workspace">
        <div className="editor glass-panel">
          <div className="panel-heading">
            <div>
              <span className="step-label">01 / CUSTOMIZE</span>
              <h2>Your QR code</h2>
            </div>
            <span className="sparkle" aria-hidden="true">✳</span>
          </div>

          <label className="field-label" htmlFor="qrText">Text or URL</label>
          <textarea
            id="qrText"
            rows="3"
            maxLength={1800}
            placeholder="https://yourwebsite.com"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="field-hint">
            <span>Paste a link or type any message</span>
            <span id="charCount">{text.length} / 1800</span>
          </div>

          <div className="section-divider"></div>
          <div className="subheading-row">
            <h3>Color palette</h3>
            <span className="tiny-label">MAKE IT YOURS</span>
          </div>
          <div className="color-grid">
            <label className="color-control">
              <span>QR color</span>
              <span className="color-picker-wrap">
                <input type="color" value={fg} onChange={(e) => { setFg(e.target.value); setActiveSwatch(-1); }} />
                <code>{fg.toUpperCase()}</code>
              </span>
            </label>
            <label className="color-control">
              <span>Background</span>
              <span className="color-picker-wrap">
                <input type="color" value={bg} onChange={(e) => { setBg(e.target.value); setActiveSwatch(-1); }} />
                <code>{bg.toUpperCase()}</code>
              </span>
            </label>
          </div>
          <div className="swatches" aria-label="Preset color themes">
            {SWATCHES.map((s, i) => (
              <button
                key={s.cls}
                className={`swatch ${s.cls}${activeSwatch === i ? " active" : ""}`}
                aria-label={s.label}
                onClick={() => { setFg(s.fg); setBg(s.bg); setActiveSwatch(i); }}
              />
            ))}
          </div>

          <div className="section-divider"></div>
          <div className="subheading-row">
            <h3>Output size</h3>
            <output id="sizeValue" htmlFor="qrSize">{size} px</output>
          </div>
          <input
            type="range"
            id="qrSize"
            min="180"
            max="600"
            step="20"
            value={size}
            style={{ background: `linear-gradient(90deg, var(--gold) ${pct}%, rgba(255,255,255,.14) ${pct}%)` }}
            onChange={(e) => setSize(Number(e.target.value))}
          />
          <div className="range-labels"><span>180 px</span><span>600 px</span></div>

          <div className="section-divider"></div>
          <div className="subheading-row">
            <h3>Center logo</h3>
            <span className="tiny-label">OPTIONAL</span>
          </div>
          <label className="upload-zone" htmlFor="logoInput">
            <span className="upload-icon">↑</span>
            <span className="upload-copy">
              <strong>{logo ? logo.name : "Upload your logo"}</strong>
              <small>{logo ? "Logo will be added to the downloaded PNG" : "PNG or JPG · square image works best"}</small>
            </span>
            <span className="upload-action">Browse</span>
          </label>
          <input ref={fileRef} type="file" id="logoInput" accept="image/png,image/jpeg,image/webp" hidden onChange={onLogoChange} />
          <button className="remove-logo" type="button" hidden={!logo} onClick={clearLogo}>Remove logo</button>
          <p className="small-note">Tip: keep the logo small so your QR code remains easy to scan.</p>

          <div className="action-row">
            <button className="button button-quiet" type="button" onClick={reset}>Reset</button>
            <button className="button button-primary" type="button" onClick={download} disabled={busy}>
              {busy ? <><span>…</span> Preparing PNG</> : <><span>↓</span> Download PNG</>}
            </button>
          </div>
          <p className="notice" role="status" aria-live="polite" style={{ color: notice.error ? "#f0a3ad" : "#c4cf86" }}>
            {notice.msg}
          </p>
        </div>

        <aside className="preview-column">
          <div className="preview-card glass-panel">
            <div className="preview-topline">
              <span className="step-label">02 / LIVE PREVIEW</span>
              <span className="live-pill"><span></span> LIVE</span>
            </div>
            <div className="qr-stage">
              <div className="qr-frame">
                <div id="qrCode" aria-label="Generated QR code preview">
                  {!trimmed && <div className="empty-state">Enter text or a URL to generate your QR code.</div>}
                  <canvas ref={canvasRef} style={{ display: trimmed ? "block" : "none" }} />
                </div>
              </div>
              <div className="qr-orbit orbit-one"></div>
              <div className="qr-orbit orbit-two"></div>
              <span className="float-star star-one">✳</span>
              <span className="float-star star-two">✦</span>
            </div>
            <div className="preview-caption">
              <span className="caption-icon">⌁</span>
              <div><strong>Ready to scan</strong><small>Your QR code updates as you customize it.</small></div>
            </div>
          </div>

          <div className="tip-card">
            <div className="tip-icon">✦</div>
            <div>
              <strong>A little pro tip</strong>
              <p>Use strong contrast between your QR color and background. Always test-scan your downloaded code before printing it.</p>
            </div>
          </div>
          <div className="privacy-note"><span className="lock-icon">▣</span> Generated in your browser. Your content stays on your device.</div>
        </aside>
      </section>
    </section>
  );
}
