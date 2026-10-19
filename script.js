const qrText = document.getElementById("qrText");
const fgColor = document.getElementById("fgColor");
const bgColor = document.getElementById("bgColor");
const fgHex = document.getElementById("fgHex");
const bgHex = document.getElementById("bgHex");
const qrSize = document.getElementById("qrSize");
const sizeValue = document.getElementById("sizeValue");
const qrCode = document.getElementById("qrCode");
const qrWorkArea = document.getElementById("qrWorkArea");
const logoInput = document.getElementById("logoInput");
const uploadZone = document.getElementById("uploadZone");
const uploadTitle = document.getElementById("uploadTitle");
const uploadSub = document.getElementById("uploadSub");
const removeLogo = document.getElementById("removeLogo");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");
const charCount = document.getElementById("charCount");
const notice = document.getElementById("notice");

const DEFAULTS = {
  text: "https://example.com",
  fg: "#8b2c3d",
  bg: "#ffffff",
  size: 320
};

let logoImage = null;
let logoObjectUrl = null;
let renderTimer = null;

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

function updateColorLabels() {
  fgHex.textContent = fgColor.value.toUpperCase();
  bgHex.textContent = bgColor.value.toUpperCase();
}

function updateSizeTrack() {
  const min = Number(qrSize.min);
  const max = Number(qrSize.max);
  const percentage = ((Number(qrSize.value) - min) / (max - min)) * 100;
  qrSize.style.background = `linear-gradient(90deg, var(--gold) ${percentage}%, rgba(255,255,255,.14) ${percentage}%)`;
  sizeValue.textContent = `${qrSize.value} px`;
}

function showNotice(message, isError = false) {
  notice.textContent = message;
  notice.style.color = isError ? "#f0a3ad" : "#c4cf86";
}

function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderQr, 120);
}

function renderQr() {
  const value = qrText.value.trim();
  charCount.textContent = `${qrText.value.length} / 1800`;
  updateColorLabels();
  updateSizeTrack();
  qrCode.innerHTML = "";
  qrWorkArea.innerHTML = "";

  if (!value) {
    qrCode.innerHTML = '<div class="empty-state">Enter text or a URL to generate your QR code.</div>';
    showNotice("Enter some text or a URL first.", true);
    return;
  }

  if (typeof QRCode === "undefined") {
    qrCode.textContent = "QR library failed to load. Check your internet connection and refresh.";
    showNotice("Could not load the QR generator library.", true);
    return;
  }

  try {
    const size = Number(qrSize.value);
    new QRCode(qrWorkArea, {
      text: value,
      width: size,
      height: size,
      colorDark: fgColor.value,
      colorLight: bgColor.value,
      correctLevel: QRCode.CorrectLevel.H
    });

    // QRCode.js creates its canvas asynchronously in some browsers.
    requestAnimationFrame(() => {
      const sourceCanvas = qrWorkArea.querySelector("canvas");
      const sourceImage = qrWorkArea.querySelector("img");
      let previewCanvas = null;
      if (sourceCanvas) {
        previewCanvas = document.createElement("canvas");
        previewCanvas.width = size;
        previewCanvas.height = size;
        previewCanvas.getContext("2d").drawImage(sourceCanvas, 0, 0, size, size);
      } else if (sourceImage) {
        previewCanvas = document.createElement("canvas");
        previewCanvas.width = size;
        previewCanvas.height = size;
        previewCanvas.getContext("2d").drawImage(sourceImage, 0, 0, size, size);
      }

      if (previewCanvas && logoImage) {
        const context = previewCanvas.getContext("2d");
        const logoSize = Math.round(size * 0.19);
        const padding = Math.round(size * 0.025);
        const x = Math.round((size - logoSize) / 2);
        const y = Math.round((size - logoSize) / 2);
        const plateSize = logoSize + padding * 2;
        const plateX = Math.round((size - plateSize) / 2);
        const plateY = Math.round((size - plateSize) / 2);
        context.fillStyle = bgColor.value;
        context.beginPath();
        context.roundRect(plateX, plateY, plateSize, plateSize, Math.max(4, size * 0.018));
        context.fill();
        context.save();
        context.beginPath();
        context.roundRect(x, y, logoSize, logoSize, Math.max(3, size * 0.012));
        context.clip();
        context.drawImage(logoImage, x, y, logoSize, logoSize);
        context.restore();
      }
      if (previewCanvas) qrCode.appendChild(previewCanvas);
    });
    showNotice("QR code generated successfully.");
  } catch (error) {
    console.error(error);
    showNotice("Could not generate this QR code. Try shorter text.", true);
  }
}

function getQrCanvas() {
  return new Promise((resolve, reject) => {
    const canvas = qrWorkArea.querySelector("canvas");
    if (canvas) {
      resolve(canvas);
      return;
    }
    const image = qrWorkArea.querySelector("img");
    if (image && image.complete) {
      const converted = document.createElement("canvas");
      converted.width = Number(qrSize.value);
      converted.height = Number(qrSize.value);
      converted.getContext("2d").drawImage(image, 0, 0, converted.width, converted.height);
      resolve(converted);
      return;
    }
    reject(new Error("QR canvas is not ready"));
  });
}

async function downloadPng() {
  if (!qrText.value.trim()) {
    showNotice("Enter some text or a URL first.", true);
    qrText.focus();
    return;
  }

  downloadBtn.disabled = true;
  downloadBtn.innerHTML = "<span>…</span> Preparing PNG";
  try {
    // Rebuild a fresh QR at the selected export dimensions.
    qrWorkArea.innerHTML = "";
    const size = Number(qrSize.value);
    new QRCode(qrWorkArea, {
      text: qrText.value.trim(),
      width: size,
      height: size,
      colorDark: fgColor.value,
      colorLight: bgColor.value,
      correctLevel: QRCode.CorrectLevel.H
    });

    let canvas = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      canvas = qrWorkArea.querySelector("canvas");
      if (canvas) break;
    }
    if (!canvas) throw new Error("QR image was not ready");

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = size;
    exportCanvas.height = size;
    const context = exportCanvas.getContext("2d");
    context.fillStyle = bgColor.value;
    context.fillRect(0, 0, size, size);
    context.drawImage(canvas, 0, 0, size, size);

    if (logoImage) {
      const logoSize = Math.round(size * 0.19);
      const padding = Math.round(size * 0.025);
      const x = Math.round((size - logoSize) / 2);
      const y = Math.round((size - logoSize) / 2);
      const plateSize = logoSize + padding * 2;
      const plateX = Math.round((size - plateSize) / 2);
      const plateY = Math.round((size - plateSize) / 2);

      // A solid background behind the logo keeps its edges clean.
      context.fillStyle = bgColor.value;
      context.beginPath();
      context.roundRect(plateX, plateY, plateSize, plateSize, Math.max(4, size * 0.018));
      context.fill();

      context.save();
      context.beginPath();
      context.roundRect(x, y, logoSize, logoSize, Math.max(3, size * 0.012));
      context.clip();
      context.drawImage(logoImage, x, y, logoSize, logoSize);
      context.restore();
    }

    const link = document.createElement("a");
    link.download = `qr-code-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    link.remove();
    showNotice("PNG downloaded. Test-scan it before printing.");
  } catch (error) {
    console.error(error);
    showNotice("Download failed. Please try again.", true);
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = "<span>↓</span> Download PNG";
  }
}

function clearLogo() {
  logoImage = null;
  if (logoObjectUrl) {
    URL.revokeObjectURL(logoObjectUrl);
    logoObjectUrl = null;
  }
  logoInput.value = "";
  uploadTitle.textContent = "Upload your logo";
  uploadSub.textContent = "PNG or JPG · square image works best";
  removeLogo.hidden = true;
  scheduleRender();
}

logoInput.addEventListener("change", () => {
  const file = logoInput.files && logoInput.files[0];
  if (!file) return;

  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    showNotice("Choose a PNG, JPG, or WebP image.", true);
    logoInput.value = "";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showNotice("Logo must be smaller than 5 MB.", true);
    logoInput.value = "";
    return;
  }

  if (logoObjectUrl) URL.revokeObjectURL(logoObjectUrl);
  logoObjectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    logoImage = image;
    uploadTitle.textContent = file.name;
    uploadSub.textContent = "Logo will be added to the downloaded PNG";
    removeLogo.hidden = false;
    scheduleRender();
    showNotice("Logo added. Download to include it in the QR code.");
  };
  image.onerror = () => showNotice("That image could not be opened.", true);
  image.src = logoObjectUrl;
});

qrText.addEventListener("input", scheduleRender);
fgColor.addEventListener("input", scheduleRender);
bgColor.addEventListener("input", scheduleRender);
qrSize.addEventListener("input", scheduleRender);
downloadBtn.addEventListener("click", downloadPng);
removeLogo.addEventListener("click", clearLogo);

document.querySelectorAll(".swatch").forEach(button => {
  button.addEventListener("click", () => {
    fgColor.value = button.dataset.fg;
    bgColor.value = button.dataset.bg;
    document.querySelectorAll(".swatch").forEach(item => item.classList.toggle("active", item === button));
    scheduleRender();
  });
});

[fgColor, bgColor].forEach(input => {
  input.addEventListener("input", () => {
    document.querySelectorAll(".swatch").forEach(item => item.classList.remove("active"));
  });
});

resetBtn.addEventListener("click", () => {
  qrText.value = DEFAULTS.text;
  fgColor.value = DEFAULTS.fg;
  bgColor.value = DEFAULTS.bg;
  qrSize.value = DEFAULTS.size;
  clearLogo();
  document.querySelectorAll(".swatch").forEach(item => item.classList.toggle("active", item.classList.contains("swatch-dark")));
  showNotice("Settings reset.");
  renderQr();
});

renderQr();
