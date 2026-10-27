import { useRef, useState } from "react";
import { convertNumberSystem, NUMBER_SYSTEMS } from "../utils/numberSystems.js";

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
  const [fromSystem, setFromSystem] = useState("10");
  const [toSystem, setToSystem] = useState("2");
  const [fromCustomBase, setFromCustomBase] = useState("3");
  const [toCustomBase, setToCustomBase] = useState("3");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [notice, setNotice] = useState("");
  const outRef = useRef(null);

  const run = () => {
    try {
      const result = mode === "number"
        ? convertNumberSystem(input, fromSystem, toSystem, fromCustomBase, toCustomBase)
        : OPERATIONS[mode](input);
      setOutput(result);
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
      <p>Format JSON, convert CSV and JSON, encode/decode text, or convert number systems.</p>
      <div className="form-grid">
        <label>
          Category
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="number">Number systems</option>
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
      {mode === "number" && (
        <div className="form-grid">
          <label>
            From
            <select value={fromSystem} onChange={(e) => setFromSystem(e.target.value)}>
              {NUMBER_SYSTEMS.map((system) => <option key={system.value} value={system.value}>{system.label}</option>)}
            </select>
          </label>
          <label>
            To
            <select value={toSystem} onChange={(e) => setToSystem(e.target.value)}>
              {NUMBER_SYSTEMS.map((system) => <option key={system.value} value={system.value}>{system.label}</option>)}
            </select>
          </label>
          {fromSystem === "other" && (
            <label>
              Source base (2–36)
              <input type="number" min="2" max="36" step="1" value={fromCustomBase} onChange={(e) => setFromCustomBase(e.target.value)} />
            </label>
          )}
          {toSystem === "other" && (
            <label>
              Destination base (2–36)
              <input type="number" min="2" max="36" step="1" value={toCustomBase} onChange={(e) => setToCustomBase(e.target.value)} />
            </label>
          )}
        </div>
      )}
      <label className="full-label">
        Input
        <textarea
          rows="7"
          placeholder={mode === "number"
            ? ({
              ascii: "Enter ASCII text...",
              bcd: "Enter four-bit BCD groups, e.g. 0001 0010",
              gray: "Enter Gray code bits, e.g. 1110",
              roman: "Enter a Roman numeral, e.g. XIV",
              arabicIndic: "Enter Arabic-Indic digits, e.g. ١٢٣",
            }[fromSystem] || "Enter a number or space/comma-separated numbers...")
            : "Paste JSON, CSV, or text here..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
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
