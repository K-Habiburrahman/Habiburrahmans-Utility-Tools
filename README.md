# Habiburrahman's Utility Tools — React

A React + Vite app with seven browser-based utility tools, one component per tab.

| Tab | Component |
| --- | --- |
| QR Generator | `src/components/QrGenerator.jsx` |
| Image | `src/components/ImageConverter.jsx` |
| PDF | `src/components/PdfTool.jsx` |
| Developer | `src/components/DevTools.jsx` |
| Audio | `src/components/AudioConverter.jsx` |
| Colors | `src/components/ColorTool.jsx` |
| Unit Converter | `src/components/UnitConverter.jsx` |

`src/App.jsx` holds the tab navigation. All tools run fully in the browser, and libraries (`qrcode`, `pdf-lib`) are bundled — no CDN needed.

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

Framework preset **Vite**, build command `npm run build`, output directory `dist`.
