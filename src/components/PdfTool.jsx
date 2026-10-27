import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { downloadBlob } from "../utils/download.js";

export default function PdfTool({ id, hidden }) {
  const [files, setFiles] = useState([]);
  const [notice, setNotice] = useState("");

  const onFiles = (e) => {
    setFiles(Array.from(e.target.files || []));
    setNotice("");
  };

  const makePdf = async () => {
    if (!files.length) return setNotice("Select one or more PNG/JPEG images first.");
    try {
      const doc = await PDFDocument.create();
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        let img;
        if (file.type === "image/png") img = await doc.embedPng(bytes);
        else if (file.type === "image/jpeg") img = await doc.embedJpg(bytes);
        else return setNotice(`${file.name} is not a PNG or JPEG image.`);
        const page = doc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      downloadBlob(new Blob([await doc.save()], { type: "application/pdf" }), "images-to-pdf.pdf");
      setNotice(`Created a PDF with ${files.length} page(s).`);
    } catch (err) {
      console.error(err);
      setNotice("Could not create the PDF. Please try smaller PNG or JPEG files.");
    }
  };

  return (
    <section id={id} className="tool-panel tab-pane" role="tabpanel" aria-labelledby={`${id}-tab`} hidden={hidden}>
      <p className="kicker">PDF TOOLKIT</p>
      <h2>Images to PDF</h2>
      <p>
        Turn one or more images into a downloadable PDF. For PDF merge/split and page extraction, use a dedicated PDF editor.
      </p>
      <label className="dropzone">
        <span>＋</span>
        <strong>Select images</strong>
        <small>Choose multiple PNG or JPEG images in page order</small>
        <input type="file" accept="image/png,image/jpeg" multiple onChange={onFiles} />
      </label>
      <div className="muted">
        {files.length ? files.map((f, i) => `${i + 1}. ${f.name}`).join(" · ") : "No images selected."}
      </div>
      <button className="primary" onClick={makePdf}>Create PDF</button>
      <p className="notice" role="status">{notice}</p>
    </section>
  );
}
