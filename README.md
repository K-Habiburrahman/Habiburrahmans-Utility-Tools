# My ToolBox

A responsive browser-based toolkit built with HTML, CSS, and vanilla JavaScript, using a burgundy, olive, forest, rose, and muted-gold visual theme.

## Included tools
- **QR Generator** (`index.html`): create styled QR codes, customize colors and size, add a center logo, download PNG.
- **Image Converter**: convert supported image formats to PNG/JPEG/WebP/ICO/SVG, resize, and adjust quality. ICO output is limited to 256 × 256 pixels; SVG files wrap the converted raster image.
- **PDF Toolkit**: combine PNG/JPEG images into a multi-page PDF.
- **Developer Utilities**: JSON formatting/validation, CSV ↔ JSON, Base64 encode/decode, URL encode/decode.
- **Audio Converter**: decode browser-supported audio and export WAV.
- **Color Lab**: HEX/RGB/HSL conversion, contrast ratio checking, and a quick palette.
- **Universal Unit Converter**: length, weight, temperature, speed, time, and digital storage.

All six non-QR tools are displayed on one page (`tools.html`).

## Run locally
1. Extract the ZIP.
2. Open `index.html` for QR generation or `tools.html` for all six tools on one page. VS Code Live Server is recommended.
3. An internet connection is needed for the QRCode.js and PDF-Lib CDN libraries and Google Fonts. Most other utilities work locally in the browser.

## Notes and limitations
- Files are processed locally in the browser wherever possible; no backend is included.
- Image conversion depends on browser codec support. JPEG does not support transparency.
- SVG output embeds the converted image as raster data; it does not vectorize the image.
- PDF Toolkit currently converts images to PDF; it does not merge or split existing PDF files.
- Audio tool exports WAV only; input codec support depends on the browser.
- The unit converter uses standard metric/imperial conversion factors; digital units are explicitly labelled decimal or binary.
- Test generated QR codes with a scanner before printing or sharing.