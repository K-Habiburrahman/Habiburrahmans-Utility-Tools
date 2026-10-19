const $ = (id) => document.getElementById(id);
const say = (id, msg) => ($(id).textContent = msg);
// Image conversion
let sourceImage = null;
$("imageFile").addEventListener("change", () => {
  const f = $("imageFile").files[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  const im = new Image();
  im.onload = () => {
    sourceImage = im;
    $("imagePreview").src = url;
    $("imagePreview").hidden = false;
    $("imageWidth").value = im.naturalWidth;
    $("imageHeight").value = im.naturalHeight;
    say(
      "imageMeta",
      `${f.name} · ${im.naturalWidth} × ${im.naturalHeight} · ${(f.size / 1024).toFixed(1)} KB`,
    );
    say("imageNotice", "Image loaded. Choose an output format and convert.");
  };
  im.onerror = () =>
    say(
      "imageNotice",
      "This image format could not be opened by your browser.",
    );
  im.src = url;
});
function updateImageQualityTrack() {
  const quality = $("imageQuality");
  const percentage =
    ((Number(quality.value) - Number(quality.min)) /
      (Number(quality.max) - Number(quality.min))) *
    100;
  quality.style.background = `linear-gradient(90deg, #a34a5a ${percentage}%, rgba(255,255,255,.14) ${percentage}%)`;
  $("qualityOut").textContent = quality.value + "%";
}

$("imageQuality").addEventListener("input", updateImageQualityTrack);
updateImageQualityTrack();

function imageBlobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read the converted image."));
    };
    reader.onerror = () =>
      reject(reader.error || new Error("Could not read the converted image."));
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

$("convertImage").addEventListener("click", () => {
  if (!sourceImage) {
    say("imageNotice", "Please select an image first.");
    return;
  }
  let w = parseInt($("imageWidth").value) || sourceImage.naturalWidth,
    h = parseInt($("imageHeight").value) || sourceImage.naturalHeight;
  if (w < 1 || h < 1 || w > 12000 || h > 12000) {
    say("imageNotice", "Enter a width and height between 1 and 12,000 pixels.");
    return;
  }
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const context = c.getContext("2d");
  if (!context) {
    say("imageNotice", "Your browser could not prepare the image for conversion.");
    return;
  }
  context.drawImage(sourceImage, 0, 0, w, h);
  const type = $("imageFormat").value;
  if (type === "image/x-icon" && (w > 256 || h > 256)) {
    say("imageNotice", "ICO images must be 256 × 256 pixels or smaller.");
    return;
  }
  const rasterType =
    type === "image/x-icon" || type === "image/svg+xml" ? "image/png" : type;
  c.toBlob(
    async (blob) => {
      if (!blob) {
        say("imageNotice", "Conversion failed. Try a different format.");
        return;
      }
      try {
        let outputBlob = blob;
        let extension;
        let format;
        if (type === "image/x-icon") {
          outputBlob = createIcoBlob(blob, w, h);
          extension = "ico";
          format = "ICO";
        } else if (type === "image/svg+xml") {
          const dataUrl = await imageBlobToDataUrl(blob);
          outputBlob = new Blob(
            [
              `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><image width="${w}" height="${h}" href="${dataUrl}"/></svg>`,
            ],
            { type: "image/svg+xml" },
          );
          extension = "svg";
          format = "SVG";
        } else {
          extension = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[
            type
          ];
          format = type.split("/")[1].toUpperCase();
        }
        downloadBlob(outputBlob, `converted-image.${extension}`);
        say("imageNotice", `Converted to ${w} × ${h} ${format} successfully.`);
      } catch (error) {
        say(
          "imageNotice",
          `Conversion failed: ${error.message || "could not create the output file."}`,
        );
      }
    },
    rasterType,
    Number($("imageQuality").value) / 100,
  );
});
// Images to PDF
let pdfFiles = [];
$("pdfImages").addEventListener("change", () => {
  pdfFiles = Array.from($("pdfImages").files);
  $("pdfList").textContent = pdfFiles.length
    ? pdfFiles.map((f, i) => `${i + 1}. ${f.name}`).join(" · ")
    : "No images selected.";
  say("pdfNotice", "");
});
$("makePdf").addEventListener("click", async () => {
  if (!pdfFiles.length) {
    say("pdfNotice", "Select one or more PNG/JPEG images first.");
    return;
  }
  if (!window.PDFLib) {
    say(
      "pdfNotice",
      "PDF library could not load. Check your internet connection and reload.",
    );
    return;
  }
  try {
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.create();
    for (const file of pdfFiles) {
      const bytes = await file.arrayBuffer();
      let img;
      if (file.type === "image/png") img = await doc.embedPng(bytes);
      else if (file.type === "image/jpeg") img = await doc.embedJpg(bytes);
      else {
        say("pdfNotice", `${file.name} is not a PNG or JPEG image.`);
        return;
      }
      const page = doc.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }
    downloadBlob(
      new Blob([await doc.save()], { type: "application/pdf" }),
      "images-to-pdf.pdf",
    );
    say("pdfNotice", `Created a PDF with ${pdfFiles.length} page(s).`);
  } catch (e) {
    say(
      "pdfNotice",
      "Could not create the PDF. Please try smaller PNG or JPEG files.",
    );
  }
});
// Developer converters
function csvParse(s) {
  const rows = [];
  let row = [],
    cell = "",
    q = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"' && q && s[i + 1] === '"') {
      cell += '"';
      i++;
    } else if (ch === '"') q = !q;
    else if (ch === "," && !q) {
      row.push(cell);
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !q) {
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
$("runDev").addEventListener("click", () => {
  try {
    const s = $("devInput").value,
      mode = $("devMode").value;
    let out = "";
    if (mode === "json") out = JSON.stringify(JSON.parse(s), null, 2);
    if (mode === "csvjson") {
      const rows = csvParse(s);
      if (!rows.length) throw Error("CSV input is empty.");
      const headers = rows.shift();
      out = JSON.stringify(
        rows.map((r) =>
          Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])),
        ),
        null,
        2,
      );
    }
    if (mode === "jsoncsv") {
      const v = JSON.parse(s);
      if (
        !Array.isArray(v) ||
        v.some((x) => !x || typeof x !== "object" || Array.isArray(x))
      )
        throw Error("Input must be an array of objects.");
      const keys = [...new Set(v.flatMap(Object.keys))];
      out = [
        keys.map(csvEscape).join(","),
        ...v.map((row) => keys.map((k) => csvEscape(row[k])).join(",")),
      ].join("\r\n");
    }
    if (mode === "b64e") out = btoa(unescape(encodeURIComponent(s)));
    if (mode === "b64d") out = decodeURIComponent(escape(atob(s.trim())));
    if (mode === "urle") out = encodeURIComponent(s);
    if (mode === "urld") out = decodeURIComponent(s);
    $("devOutput").value = out;
    say("devNotice", "Conversion completed.");
  } catch (e) {
    say("devNotice", "Could not convert: " + e.message);
  }
});
$("copyDev").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("devOutput").value);
    say("devNotice", "Output copied.");
  } catch (e) {
    $("devOutput").select();
    say("devNotice", "Select the output and copy it manually.");
  }
});
// Audio to WAV
let audioBuffer = null;
$("audioFile").addEventListener("change", async () => {
  const f = $("audioFile").files[0];
  audioBuffer = null;
  if (!f) return;
  $("audioPreview").src = URL.createObjectURL(f);
  $("audioPreview").hidden = false;
  say(
    "audioMeta",
    `${f.name} · ${(f.size / 1024 / 1024).toFixed(2)} MB · decoding…`,
  );
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioBuffer = await ctx.decodeAudioData(await f.arrayBuffer());
    say(
      "audioMeta",
      `${f.name} · ${audioBuffer.duration.toFixed(1)} seconds · ${audioBuffer.numberOfChannels} channel(s) · ${audioBuffer.sampleRate} Hz`,
    );
    await ctx.close();
    say("audioNotice", "Audio ready for WAV export.");
  } catch (e) {
    say("audioMeta", f.name);
    say(
      "audioNotice",
      "Your browser could not decode this audio format. Try WAV or MP3.",
    );
  }
});
function wavBlob(buffer) {
  const channels = buffer.numberOfChannels,
    rate = buffer.sampleRate,
    frames = buffer.length,
    bytes = 44 + frames * channels * 2,
    ab = new ArrayBuffer(bytes),
    v = new DataView(ab);
  const write = (o, s) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  write(0, "RIFF");
  v.setUint32(4, bytes - 8, true);
  write(8, "WAVE");
  write(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, channels, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * channels * 2, true);
  v.setUint16(32, channels * 2, true);
  v.setUint16(34, 16, true);
  write(36, "data");
  v.setUint32(40, bytes - 44, true);
  const data = Array.from({ length: channels }, (_, c) =>
    buffer.getChannelData(c),
  );
  let o = 44;
  for (let i = 0; i < frames; i++)
    for (let c = 0; c < channels; c++) {
      let x = Math.max(-1, Math.min(1, data[c][i]));
      v.setInt16(o, x < 0 ? x * 32768 : x * 32767, true);
      o += 2;
    }
  return new Blob([ab], { type: "audio/wav" });
}
$("convertAudio").addEventListener("click", () => {
  if (!audioBuffer) {
    say("audioNotice", "Choose a supported audio file and wait for decoding.");
    return;
  }
  if (audioBuffer.length * audioBuffer.numberOfChannels > 50000000) {
    say(
      "audioNotice",
      "This audio is too large to safely convert in the browser.",
    );
    return;
  }
  downloadBlob(wavBlob(audioBuffer), "converted-audio.wav");
  say("audioNotice", "WAV file created and downloaded.");
});
// Color conversion
function clamp(n) {
  return Math.max(0, Math.min(255, Math.round(n)));
}
function hexRgb(hex) {
  let h = hex.replace("#", "").trim();
  if (/^[0-9a-f]{3}$/i.test(h))
    h = h
      .split("")
      .map((x) => x + x)
      .join("");
  if (!/^[0-9a-f]{6}$/i.test(h))
    throw Error("Enter a valid HEX value such as #8B2C3D.");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
function rgbHex([r, g, b]) {
  return (
    "#" +
    [r, g, b]
      .map((x) => clamp(x).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}
function rgbHsl([r, g, b]) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  let h = 0,
    s = 0,
    l = (max + min) / 2;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}
function lum(rgb) {
  const a = rgb.map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function updateColor(fromHex = true) {
  try {
    const rgb = hexRgb(fromHex ? $("hexInput").value : $("colorPicker").value),
      hex = rgbHex(rgb),
      hsl = rgbHsl(rgb);
    $("hexInput").value = hex;
    $("colorPicker").value = hex;
    $("rgbOutput").value = `rgb(${rgb.join(", ")})`;
    $("hslOutput").value = `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;
    $("colorSwatch").style.background = hex;
    const bg = hexRgb($("contrastPicker").value),
      l1 = lum(rgb),
      l2 = lum(bg),
      ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    $("contrastResult").textContent =
      `Contrast ratio: ${ratio.toFixed(2)}:1 · ${ratio >= 7 ? "AAA normal text" : ratio >= 4.5 ? "AA normal text" : ratio >= 3 ? "Large text only" : "Low contrast"}`;
    $("contrastResult").style.color = hex;
    $("contrastResult").style.background = $("contrastPicker").value;
    say("colorNotice", "");
  } catch (e) {
    say("colorNotice", e.message);
  }
}
$("colorPicker").addEventListener("input", () => updateColor(false));
$("hexInput").addEventListener("change", () => updateColor(true));
$("contrastPicker").addEventListener("input", () => updateColor());
$("copyHex").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("hexInput").value);
    say("colorNotice", "HEX color copied.");
  } catch (e) {
    $("hexInput").select();
    say("colorNotice", "Select and copy the HEX value manually.");
  }
});
const palette = [
  "#8B2C3D",
  "#516345",
  "#867B18",
  "#C77C83",
  "#EDE6D4",
  "#211B20",
];
$("paletteSwatches").innerHTML = palette
  .map(
    (c) =>
      `<button class="palette-swatch" style="background:${c}" data-color="${c}" aria-label="Use ${c}"><span>${c}</span></button>`,
  )
  .join("");
$("paletteSwatches").addEventListener("click", (e) => {
  const b = e.target.closest("[data-color]");
  if (b) {
    $("colorPicker").value = b.dataset.color;
    updateColor(false);
  }
});
updateColor();
function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Universal unit converter
const unitSets = {
  length: {
    label: "Length",
    units: {
      Meters: 1,
      Kilometers: 1000,
      Centimeters: 0.01,
      Millimeters: 0.001,
      Miles: 1609.344,
      Yards: 0.9144,
      Feet: 0.3048,
      Inches: 0.0254,
    },
  },
  weight: {
    label: "Weight / Mass",
    units: {
      Kilograms: 1,
      Grams: 0.001,
      Milligrams: 0.000001,
      "Metric tons": 1000,
      Pounds: 0.45359237,
      Ounces: 0.028349523125,
    },
  },
  speed: {
    label: "Speed",
    units: {
      "Meters/second": 1,
      "Kilometers/hour": 1 / 3.6,
      "Miles/hour": 0.44704,
      "Feet/second": 0.3048,
      Knots: 0.514444,
    },
  },
  time: {
    label: "Time",
    units: {
      Seconds: 1,
      Milliseconds: 0.001,
      Minutes: 60,
      Hours: 3600,
      Days: 86400,
      Weeks: 604800,
    },
  },
  storage: {
    label: "Digital storage",
    units: {
      Bytes: 1,
      "Kilobytes (1000 B)": 1000,
      "Megabytes (1000 KB)": 1e6,
      "Gigabytes (1000 MB)": 1e9,
      "Kibibytes (1024 B)": 1024,
      "Mebibytes (1024 KiB)": 1048576,
      "Gibibytes (1024 MiB)": 1073741824,
    },
  },
};
function fillUnits() {
  const cat = $("unitCategory").value;
  let names =
    cat === "temperature"
      ? ["Celsius", "Fahrenheit", "Kelvin"]
      : Object.keys(unitSets[cat].units);
  for (const id of ["unitFrom", "unitTo"]) {
    const el = $(id),
      old = el.value;
    el.innerHTML = names.map((n) => `<option>${n}</option>`).join("");
    if (names.includes(old)) el.value = old;
  }
  if (cat === "length") {
    $("unitFrom").value = "Meters";
    $("unitTo").value = "Feet";
  } else if (cat === "weight") {
    $("unitFrom").value = "Kilograms";
    $("unitTo").value = "Pounds";
  } else if (cat === "temperature") {
    $("unitFrom").value = "Celsius";
    $("unitTo").value = "Fahrenheit";
  } else if (cat === "speed") {
    $("unitFrom").value = "Kilometers/hour";
    $("unitTo").value = "Miles/hour";
  } else if (cat === "time") {
    $("unitFrom").value = "Hours";
    $("unitTo").value = "Minutes";
  } else {
    $("unitFrom").value = "Megabytes (1000 KB)";
    $("unitTo").value = "Gigabytes (1000 MB)";
  }
  convertUnits();
}
function convertUnits() {
  const cat = $("unitCategory").value,
    val = Number($("unitValue").value),
    from = $("unitFrom").value,
    to = $("unitTo").value;
  if ($("unitValue").value.trim() === "" || !Number.isFinite(val)) {
    $("unitResult").textContent = "Enter a valid number";
    return;
  }
  let out;
  if (cat === "temperature") {
    let c =
      from === "Celsius"
        ? val
        : from === "Fahrenheit"
          ? ((val - 32) * 5) / 9
          : val - 273.15;
    out =
      to === "Celsius"
        ? c
        : to === "Fahrenheit"
          ? (c * 9) / 5 + 32
          : c + 273.15;
  } else {
    const units = unitSets[cat].units;
    out = (val * units[from]) / units[to];
  }
  const fmt = (n) =>
    Number(n.toPrecision(10)).toLocaleString(undefined, {
      maximumFractionDigits: 8,
    });
  $("unitResult").textContent = `${fmt(out)} ${to}`;
  $("unitNotice").textContent = `${fmt(val)} ${from} = ${fmt(out)} ${to}`;
}
$("unitCategory").addEventListener("change", fillUnits);
["unitValue", "unitFrom", "unitTo"].forEach((id) =>
  $(id).addEventListener(id === "unitValue" ? "input" : "change", convertUnits),
);
fillUnits();
