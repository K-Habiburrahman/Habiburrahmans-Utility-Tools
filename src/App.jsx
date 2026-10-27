import { useState } from "react";
import "./style.css";
import "./tools.css";
import QrGenerator from "./components/QrGenerator.jsx";
import ImageConverter from "./components/ImageConverter.jsx";
import PdfTool from "./components/PdfTool.jsx";
import DevTools from "./components/DevTools.jsx";
import AudioConverter from "./components/AudioConverter.jsx";
import ColorTool from "./components/ColorTool.jsx";
import UnitConverter from "./components/UnitConverter.jsx";
import Navbar from "./components/Navbar.jsx";

const TABS = [
  { id: "qrPane", label: "QR Generator", icon: "▦", Component: QrGenerator },
  { id: "imageTool", label: "Image", icon: "▧", Component: ImageConverter },
  { id: "pdfTool", label: "PDF", icon: "▤", Component: PdfTool },
  { id: "devTool", label: "Developer", icon: "{ }", Component: DevTools },
  { id: "audioTool", label: "Audio", icon: "♫", Component: AudioConverter },
  { id: "colorTool", label: "Colors", icon: "◉", Component: ColorTool },
  { id: "unitTool", label: "Unit Converter", icon: "↔", Component: UnitConverter },
];

export default function App() {
  const [active, setActive] = useState(TABS[0].id);

  const selectTab = (id) => {
    setActive(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <main className="app-shell">
        <header className="topbar">
          <a
            className="brand"
            href="#qrPane"
            aria-label="Habiburrahman's Utility Tools home"
            onClick={(e) => {
              e.preventDefault();
              selectTab(TABS[0].id);
            }}
          >
            <span className="brand-mark">
              <span></span><span></span><span></span><span></span>
            </span>
            <span>
              Habiburrahman's <span className="brand-accent">Utility Tools</span>
            </span>
          </a>
          <div className="topbar-note">
            <span className="status-dot" />
            <span>Simple tools, right in your browser</span>
          </div>
        </header>

        <Navbar tabs={TABS} activeTab={active} onSelect={selectTab} />

        {/* All panes stay mounted so each tool keeps its state when you switch tabs */}
        {TABS.map(({ id, Component }) => (
          <Component key={id} id={id} hidden={active !== id} />
        ))}

        <footer>
          <span>Habiburrahman's Utility Tools © 2026</span>
          <span>Useful tools, thoughtfully made. · Your files stay yours.</span>
        </footer>
      </main>
    </>
  );
}
