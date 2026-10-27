import { useState } from "react";

const UNIT_SETS = {
  length: { label: "Length", units: { Meters: 1, Kilometers: 1000, Centimeters: 0.01, Millimeters: 0.001, Miles: 1609.344, Yards: 0.9144, Feet: 0.3048, Inches: 0.0254 }, from: "Meters", to: "Feet" },
  weight: { label: "Weight / Mass", units: { Kilograms: 1, Grams: 0.001, Milligrams: 0.000001, "Metric tons": 1000, Pounds: 0.45359237, Ounces: 0.028349523125 }, from: "Kilograms", to: "Pounds" },
  temperature: { label: "Temperature", units: { Celsius: 0, Fahrenheit: 0, Kelvin: 0 }, from: "Celsius", to: "Fahrenheit" },
  speed: { label: "Speed", units: { "Meters/second": 1, "Kilometers/hour": 1 / 3.6, "Miles/hour": 0.44704, "Feet/second": 0.3048, Knots: 0.514444 }, from: "Kilometers/hour", to: "Miles/hour" },
  time: { label: "Time", units: { Seconds: 1, Milliseconds: 0.001, Minutes: 60, Hours: 3600, Days: 86400, Weeks: 604800 }, from: "Hours", to: "Minutes" },
  storage: { label: "Digital storage", units: { Bytes: 1, "Kilobytes (1000 B)": 1000, "Megabytes (1000 KB)": 1e6, "Gigabytes (1000 MB)": 1e9, "Kibibytes (1024 B)": 1024, "Mebibytes (1024 KiB)": 1048576, "Gibibytes (1024 MiB)": 1073741824 }, from: "Megabytes (1000 KB)", to: "Gigabytes (1000 MB)" },
};

const fmt = (n) => Number(n.toPrecision(10)).toLocaleString(undefined, { maximumFractionDigits: 8 });

function convert(cat, val, from, to) {
  if (cat === "temperature") {
    const c = from === "Celsius" ? val : from === "Fahrenheit" ? ((val - 32) * 5) / 9 : val - 273.15;
    return to === "Celsius" ? c : to === "Fahrenheit" ? (c * 9) / 5 + 32 : c + 273.15;
  }
  const u = UNIT_SETS[cat].units;
  return (val * u[from]) / u[to];
}

export default function UnitConverter({ id, hidden }) {
  const [category, setCategory] = useState("length");
  const [value, setValue] = useState("1");
  const [from, setFrom] = useState("Meters");
  const [to, setTo] = useState("Feet");

  const onCategory = (cat) => {
    setCategory(cat);
    setFrom(UNIT_SETS[cat].from);
    setTo(UNIT_SETS[cat].to);
  };

  const names = Object.keys(UNIT_SETS[category].units);
  const num = Number(value);
  const valid = value.trim() !== "" && Number.isFinite(num);
  const out = valid ? convert(category, num, from, to) : null;

  return (
    <section id={id} className="tool-panel tab-pane" role="tabpanel" aria-labelledby={`${id}-tab`} hidden={hidden}>
      <p className="kicker">UNIVERSAL UNIT CONVERTER</p>
      <h2>Convert everyday units</h2>
      <p>Convert length, weight, temperature, speed, time, and digital storage units instantly.</p>
      <div className="form-grid">
        <label>
          Category
          <select value={category} onChange={(e) => onCategory(e.target.value)}>
            {Object.entries(UNIT_SETS).map(([k, s]) => (
              <option key={k} value={k}>{s.label}</option>
            ))}
          </select>
        </label>
        <label>
          Value
          <input type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} />
        </label>
        <label>
          From
          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            {names.map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
        <label>
          To
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            {names.map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
      </div>
      <div className="unit-result">
        <span>Converted result</span>
        <strong>{valid ? `${fmt(out)} ${to}` : "Enter a valid number"}</strong>
      </div>
      <p className="notice" role="status">{valid ? `${fmt(num)} ${from} = ${fmt(out)} ${to}` : ""}</p>
    </section>
  );
}
