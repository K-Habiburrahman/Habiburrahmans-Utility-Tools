import { useEffect, useRef, useState } from "react";
import { downloadBlob } from "../utils/download.js";

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read the converted image."));
    reader.onerror = () => reject(reader.error || new Error("Could not read the converted image."));
    reader.readAsDataURL(blob);
  });
}

function createIcoBlob(pngBlob, width, height) {
  const header = new ArrayBuffer(22);
  const view = new DataView(header);
  view.setUint16(2, 1, true);
  view.setUint16(4, 1, true);
  view.setUint8(6, width === 256 ? 0 : width);
  view.setUint8(7, height === 256 ? 0 : height);
  view.setUint16(10, 1, true);
  view.setUint16(12, 32, true);
  view.setUint32(14, pngBlob.size, true);
  view.setUint32(18, 22, true);
  return new Blob([header, pngBlob], { type: "image/x-icon" });
}

export default function ImageConverter({ id, hidden }) {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [meta, setMeta] = useState("Select an image to preview it.");
  const [format, setFormat] = useState("image/png");
  const [quality, setQuality] = useState(90);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [notice, setNotice] = useState("");
  const urlRef = useRef(null);

  useEffect(() => () => urlRef.current && URL.revokeObjectURL(urlRef.current), []);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(f);
    urlRef.current = url;
    const im = new Image();
    im.onload = () => {
      setImage(im);
      setPreviewUrl(url);
      setWidth(im.naturalWidth);
      setHeight(im.naturalHeight);
      setMeta(`${f.name} · ${im.naturalWidth} × ${im.naturalHeight} · ${(f.size / 1024).toFixed(1)} KB`);
      setNotice("Image loaded. Choose an output format and convert.");
    };
    im.onerror = () => setNotice("This image format could not be opened by your browser.");
    im.src = url;
  };

  const convert = () => {
    if (!image) return setNotice("Please select an image first.");
    const w = parseInt(width) || image.naturalWidth;
    const h = parseInt(height) || image.naturalHeight;
    if (w < 1 || h < 1 || w > 12000 || h > 12000)
      return setNotice("Enter a width and height between 1 and 12,000 pixels.");
    if (format === "image/x-icon" && (w > 256 || h > 256))
      return setNotice("ICO images must be 256 × 256 pixels or smaller.");

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return setNotice("Your browser could not prepare the image for conversion.");
    ctx.drawImage(image, 0, 0, w, h);

    const rasterType = format === "image/x-icon" || format === "image/svg+xml" ? "image/png" : format;
    canvas.toBlob(
      async (blob) => {
        if (!blob) return setNotice("Conversion failed. Try a different format.");
        try {
          let out = blob, ext, label;
          if (format === "image/x-icon") {
            out = createIcoBlob(blob, w, h);
            ext = "ico";
            label = "ICO";
          } else if (format === "image/svg+xml") {
            const dataUrl = await blobToDataUrl(blob);
            out = new Blob(
              [`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><image width="${w}" height="${h}" href="${dataUrl}"/></svg>`],
              { type: "image/svg+xml" },
            );
            ext = "svg";
            label = "SVG";
          } else {
            ext = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[format];
            label = format.split("/")[1].toUpperCase();
          }
          downloadBlob(out, `converted-image.${ext}`);
          setNotice(`Converted to ${w} × ${h} ${label} successfully.`);
        } catch (err) {
          setNotice(`Conversion failed: ${err.message || "could not create the output file."}`);
        }
      },
      rasterType,
      quality / 100,
    );
  };

  const pct = ((quality - 10) / 90) * 100;

  return (
    <section id={id} className="tool-panel tab-pane" role="tabpanel" aria-labelledby={`${id}-tab`} hidden={hidden}>
      <div className="panel-head">
        <div>
          <p className="kicker">IMAGE CONVERTER</p>
          <h2>Convert & resize images</h2>
          <p>Convert common image files to PNG, JPEG, WebP, ICO, or SVG and adjust output size.</p>
        </div>
      </div>
      <label className="dropzone">
        <span>＋</span>
        <strong>Choose an image</strong>
        <small>PNG, JPG, WebP, AVIF supported by your browser</small>
        <input type="file" accept="image/*" onChange={onFile} />
      </label>
      <div className="form-grid">
        <label>
          Output format
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="image/png">PNG</option>
            <option value="image/jpeg">JPEG</option>
            <option value="image/webp">WebP</option>
            <option value="image/x-icon">ICO</option>
            <option value="image/svg+xml">SVG</option>
          </select>
        </label>
        <label>
          Quality <output>{quality}%</output>
          <input
            type="range"
            min="10"
            max="100"
            value={quality}
            style={{ background: `linear-gradient(90deg, #a34a5a ${pct}%, rgba(255,255,255,.14) ${pct}%)` }}
            onChange={(e) => setQuality(Number(e.target.value))}
          />
        </label>
        <label>
          Width (px)
          <input type="number" min="1" placeholder="Original width" value={width} onChange={(e) => setWidth(e.target.value)} />
        </label>
        <label>
          Height (px)
          <input type="number" min="1" placeholder="Original height" value={height} onChange={(e) => setHeight(e.target.value)} />
        </label>
      </div>
      <div className="preview-row">
        <img src={previewUrl || undefined} alt="Image preview" hidden={!previewUrl} />
        <p className="muted">{meta}</p>
      </div>
      <button className="primary" onClick={convert}>Convert & download</button>
      <p className="notice" role="status">{notice}</p>
    </section>
  );
}
