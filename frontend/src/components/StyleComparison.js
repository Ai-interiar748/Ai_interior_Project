import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getApiUrl } from "../config";
import "./StyleComparison.css";

const STYLES = [
  { id: "minimalist", name: "Minimalist" },
  { id: "industrial", name: "Industrial" },
  { id: "cyberpunk", name: "Cyberpunk" },
  { id: "modern_luxury", name: "Modern Luxury" },
  { id: "scandinavian", name: "Scandinavian" },
  { id: "midcentury_modern", name: "Mid-Century" },
  { id: "japanese_zen", name: "Japanese Zen" },
  { id: "bohemian", name: "Bohemian" },
];

export default function StyleComparison({ original, currentImage, currentStyle }) {
  const [open, setOpen] = useState(false);
  const [secondStyle, setSecondStyle] = useState(null);
  const [secondImage, setSecondImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const availableStyles = STYLES.filter(s => s.id !== currentStyle);

  const handleGenerate = async () => {
    if (!secondStyle) return;
    setLoading(true);
    setProgress(10);

    try {
      setProgress(25);
      const res = await fetch(`${getApiUrl()}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: secondStyle }),
      });

      setProgress(80);
      const data = await res.json();

      if (data.image) {
        setProgress(100);
        await new Promise(r => setTimeout(r, 300));
        setSecondImage("data:image/jpeg;base64," + data.image);
      }
    } catch (err) {
      alert("Generation failed: " + err.message);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleDownloadComparison = () => {
    const canvas = document.createElement("canvas");
    const panelWidth = 600;
    const panelHeight = 400;
    const labelHeight = 40;
    canvas.width = panelWidth * 3;
    canvas.height = panelHeight + labelHeight;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const drawPanel = (src, label, x) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.drawImage(img, x, 0, panelWidth, panelHeight);
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(x, panelHeight, panelWidth, labelHeight);
          ctx.fillStyle = "rgba(201, 168, 76, 0.9)";
          ctx.font = "bold 14px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(label.toUpperCase(), x + panelWidth / 2, panelHeight + 26);
          resolve();
        };
        img.src = src;
      });
    };

    Promise.all([
      drawPanel(original, "Original", 0),
      drawPanel(currentImage, currentStyle.replace(/_/g, " "), panelWidth),
      secondImage ? drawPanel(secondImage, secondStyle.replace(/_/g, " "), panelWidth * 2) : Promise.resolve()
    ]).then(() => {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.download = `InteriorAI-comparison-${Date.now()}.jpg`;
      link.click();
    });
  };

  return (
    <div className="comparison-wrapper">
      <button
        className="comparison-trigger"
        onClick={() => setOpen(!open)}
      >
        {open ? "✕ Close Comparison" : "⊞ Compare with Another Style"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="comparison-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
          >
            {/* 3 Panel View */}
            <div className="comparison-grid">
              {/* Panel 1 — Original */}
              <div className="comp-panel">
                <div className="comp-img-wrap">
                  <img src={original} alt="Original" />
                </div>
                <div className="comp-label">Original</div>
              </div>

              {/* Panel 2 — Current Style */}
              <div className="comp-panel">
                <div className="comp-img-wrap">
                  <img src={currentImage} alt={currentStyle} />
                </div>
                <div className="comp-label current">
                  {currentStyle.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  <span className="comp-badge">Current</span>
                </div>
              </div>

              {/* Panel 3 — Second Style */}
              <div className="comp-panel">
                <div className="comp-img-wrap second">
                  {secondImage ? (
                    <img src={secondImage} alt={secondStyle} />
                  ) : loading ? (
                    <div className="comp-loading">
                      <div className="comp-progress-bar">
                        <motion.div
                          className="comp-progress-fill"
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <span>Generating {secondStyle?.replace(/_/g, " ")}...</span>
                    </div>
                  ) : (
                    <div className="comp-empty">
                      <span className="comp-empty-icon">◈</span>
                      <span>Select a style below</span>
                    </div>
                  )}
                </div>
                <div className="comp-label">
                  {secondStyle
                    ? secondStyle.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
                    : "Second Style"}
                </div>
              </div>
            </div>

            {/* Style Picker */}
            {!secondImage && (
              <div className="comp-picker">
                <p className="comp-picker-label">Choose a style to compare:</p>
                <div className="comp-style-list">
                  {availableStyles.map(s => (
                    <button
                      key={s.id}
                      className={`comp-style-btn ${secondStyle === s.id ? "active" : ""}`}
                      onClick={() => setSecondStyle(s.id)}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                <button
                  className="comp-generate-btn"
                  disabled={!secondStyle || loading}
                  onClick={handleGenerate}
                >
                  {loading ? "Generating..." : "Generate Comparison →"}
                </button>
              </div>
            )}

            {/* Actions */}
            {secondImage && (
              <motion.div
                className="comp-actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <button
                  className="comp-reset-btn"
                  onClick={() => { setSecondImage(null); setSecondStyle(null); }}
                >
                  ↺ Try Different Style
                </button>
                <button
                  className="comp-download-btn"
                  onClick={handleDownloadComparison}
                >
                  ↓ Download Comparison
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}