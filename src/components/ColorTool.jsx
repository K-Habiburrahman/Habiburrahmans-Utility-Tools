import { useMemo, useState } from "react";

const PALETTE = ["#8B2C3D", "#516345", "#867B18", "#C77C83", "#EDE6D4", "#211B20"];

const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));

function hexToRgb(hex) {
  let h = hex.replace("#", "").trim();
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split("").map((x) => x + x).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) throw Error("Enter a valid HEX value such as #8B2C3D.");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const rgbToHex = (rgb) => "#" + rgb.map((x) => clamp(x).toString(16).padStart(2, "0")).join("").toUpperCase();

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export default function ColorTool({ id, hidden }) {
  const [hex, setHex] = useState("#8B2C3D"); // last valid color
  const [hexText, setHexText] = useState("#8B2C3D"); // what's typed in the box
  const [contrastBg, setContrastBg] = useState("#ffffff");
  const [notice, setNotice] = useState("");

  const info = useMemo(() => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb);
    const l1 = luminance(rgb), l2 = luminance(hexToRgb(contrastBg));
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const grade = ratio >= 7 ? "AAA normal text" : ratio >= 4.5 ? "AA normal text" : ratio >= 3 ? "Large text only" : "Low contrast";
    return {
      rgb: `rgb(${rgb.join(", ")})`,
      hsl: `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`,
      contrast: `Contrast ratio: ${ratio.toFixed(2)}:1 · ${grade}`,
    };
  }, [hex, contrastBg]);

  const applyColor = (value) => {
    try {
      const h = rgbToHex(hexToRgb(value));
      setHex(h);
      setHexText(h);
      setNotice("");
    } catch (e) {
      setNotice(e.message);
    }
  };

  const copyHex = async () => {
    try {
      await navigator.clipboard.writeText(hexText);
      setNotice("HEX color copied.");
    } catch {
      setNotice("Select and copy the HEX value manually.");
    }
  };

  return (
    <section id={id} className="tool-panel tab-pane" role="tabpanel" aria-labelledby={`${id}-tab`} hidden={hidden}>
      <p className="kicker">COLOR CONVERTER</p>
      <h2>Color lab</h2>
      <p>Convert HEX, RGB, and HSL values, preview the color, and check contrast against a background.</p>
      <div className="color-layout">
        <div>
          <label className="full-label">
            Pick a color
            <input type="color" value={hex.toLowerCase()} onChange={(e) => applyColor(e.target.value)} />
          </label>
          <label className="full-label">
            HEX
            <input
              value={hexText}
              maxLength={7}
              onChange={(e) => setHexText(e.target.value)}
              onBlur={() => applyColor(hexText)}
              onKeyDown={(e) => e.key === "Enter" && applyColor(hexText)}
            />
          </label>
          <label className="full-label">RGB<input readOnly value={info.rgb} /></label>
          <label className="full-label">HSL<input readOnly value={info.hsl} /></label>
        </div>
        <div>
          <div className="color-swatch" style={{ background: hex }} />
          <label className="full-label">
            Contrast background
            <input type="color" value={contrastBg} onChange={(e) => setContrastBg(e.target.value)} />
          </label>
          <div className="contrast-result" style={{ color: hex, background: contrastBg }}>{info.contrast}</div>
          <button className="secondary" onClick={copyHex}>Copy HEX</button>
        </div>
      </div>
      <div className="palette">
        <h3>Quick palette</h3>
        <div id="paletteSwatches">
          {PALETTE.map((c) => (
            <button key={c} className="palette-swatch" style={{ background: c }} aria-label={`Use ${c}`} onClick={() => applyColor(c)}>
              <span>{c}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="notice" role="status">{notice}</p>
    </section>
  );
}
