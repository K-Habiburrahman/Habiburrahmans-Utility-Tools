import { useRef, useState } from "react";

function csvParse(s) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"' && q && s[i + 1] === '"') { cell += '"'; i++; }
    else if (ch === '"') q = !q;
    else if (ch === "," && !q) { row.push(cell); cell = ""; }
    else if ((ch === "\n" || ch === "\r") && !q) {
      if (ch === "\r" && s[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((v) => v !== "")) rows.push(row);
  return rows;
}

function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function toBase64(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function fromBase64(s) {
  const bin = atob(s.trim());
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

const OPERATIONS = {
  json: (s) => JSON.stringify(JSON.parse(s), null, 2),
  csvjson: (s) => {
    const rows = csvParse(s);
    if (!rows.length) throw Error("CSV input is empty.");
    const headers = rows.shift();
    return JSON.stringify(
      rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""]))),
      null,
      2,
    );
  },
  jsoncsv: (s) => {
    const v = JSON.parse(s);
    if (!Array.isArray(v) || v.some((x) => !x || typeof x !== "object" || Array.isArray(x)))
      throw Error("Input must be an array of objects.");
    const keys = [...new Set(v.flatMap(Object.keys))];
    return [keys.map(csvEscape).join(","), ...v.map((row) => keys.map((k) => csvEscape(row[k])).join(","))].join("\r\n");
  },
  b64e: toBase64,
  b64d: fromBase64,
  urle: encodeURIComponent,
  urld: decodeURIComponent,
};

export default function DevTools({ id, hidden }) {
  const [mode, setMode] = useState("json");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [notice, setNotice] = useState("");
  const outRef = useRef(null);

  const run = () => {
    try {
      setOutput(OPERATIONS[mode](input));
      setNotice("Conversion completed.");
    } catch (e) {
      setNotice("Could not convert: " + e.message);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setNotice("Output copied.");
    } catch {
      outRef.current?.select();
      setNotice("Select the output and copy it manually.");
    }
  };

  return (
    <section id={id} className="tool-panel tab-pane" role="tabpanel" aria-labelledby={`${id}-tab`} hidden={hidden}>
      <p className="kicker">DEVELOPER UTILITIES</p>
      <h2>Data & text converters</h2>
      <p>Format JSON, convert CSV and JSON, or encode/decode Base64 and URL text.</p>
      <div className="form-grid">
        <label>
          Operation
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="json">Format / validate JSON</option>
            <option value="csvjson">CSV → JSON</option>
            <option value="jsoncsv">JSON → CSV</option>
            <option value="b64e">Text → Base64</option>
            <option value="b64d">Base64 → Text</option>
            <option value="urle">URL encode</option>
            <option value="urld">URL decode</option>
          </select>
        </label>
        <label>
          Output actions
          <button className="secondary" type="button" onClick={copy}>Copy output</button>
        </label>
      </div>
      <label className="full-label">
        Input
        <textarea rows="7" placeholder="Paste JSON, CSV, or text here..." value={input} onChange={(e) => setInput(e.target.value)} />
      </label>
      <button className="primary" onClick={run}>Convert</button>
      <label className="full-label">
        Output
        <textarea ref={outRef} rows="7" readOnly placeholder="Your result appears here..." value={output} />
      </label>
      <p className="notice" role="status">{notice}</p>
    </section>
  );
}
