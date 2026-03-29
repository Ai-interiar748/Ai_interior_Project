import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ColorPaletteSelector from "./ColorPaletteSelector";
import "./StyleSelector.css";

const STYLES = [
  { id: "minimalist", name: "Minimalist", desc: "Clean lines, white space, serene", emoji: "◻", color: "#e8e6df" },
  { id: "industrial", name: "Industrial", desc: "Raw concrete, metal, exposed brick", emoji: "⬡", color: "#8a7a6a" },
  { id: "cyberpunk", name: "Cyberpunk", desc: "Neon lights, RGB, sci-fi future", emoji: "◈", color: "#4fc3f7" },
  { id: "modern_luxury", name: "Modern Luxury", desc: "Marble, gold accents, velvet", emoji: "◇", color: "#c9a84c" },
  { id: "scandinavian", name: "Scandinavian", desc: "Hygge warmth, natural wood, cozy", emoji: "❋", color: "#a8b89a" },
  { id: "midcentury_modern", name: "Mid-Century", desc: "Retro 1960s, teak, geometric", emoji: "◑", color: "#c4774a" },
  { id: "japanese_zen", name: "Japanese Zen", desc: "Wabi-sabi, tatami, bamboo peace", emoji: "⬤", color: "#8aa88e" },
  { id: "bohemian", name: "Bohemian", desc: "Colorful textiles, eclectic, vibrant", emoji: "✦", color: "#c47aad" },
];

export default function StyleSelector({ uploadedImage, onGenerate }) {
  const [selected, setSelected] = useState(null);
  const [previews, setPreviews] = useState({});
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [previewDone, setPreviewDone] = useState(false);
  const [modalStyle, setModalStyle] = useState(null);
  const [selectedPalette, setSelectedPalette] = useState(null);

const handlePreviewAll = async () => {
    setLoadingPreviews(true);
    setPreviews({});
    setPreviewDone(false);
    try {
      const res = await fetch("http://localhost:5000/preview-styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ palette: selectedPalette }),
      });
      const data = await res.json();
      if (data.previews) {
        setPreviews(data.previews);
        setPreviewDone(true);
      }
    } catch (err) {
      alert("Preview failed: " + err.message);
    } finally {
      setLoadingPreviews(false);
    }
  };

  const handleThumbClick = (styleId) => {
    setModalStyle(styleId);
  };

  const handleSelectFromModal = (styleId) => {
    setSelected(styleId);
    setModalStyle(null);
  };

  return (
    <div className="style-container">

      {/* Uploaded Image Preview */}
      {uploadedImage && (
        <div className="style-preview-strip">
          <img src={uploadedImage} alt="Your room" />
          <div className="strip-label">Your room</div>
        </div>
      )}

      {/* Color Palette Selector */}
      <ColorPaletteSelector onPaletteChange={setSelectedPalette} />

      {/* Preview All Button */}
      {!previewDone && (
        <motion.div
          className="preview-all-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            className="preview-all-btn"
            onClick={handlePreviewAll}
            disabled={loadingPreviews}
          >
            {loadingPreviews ? (
              <>
                <div className="preview-spinner" />
                Generating all 8 styles... (~3 minutes)
              </>
            ) : (
              <>◈ Preview All 8 Styles</>
            )}
          </button>
          <p className="preview-hint">
            See your room in all styles before choosing — or scroll down to pick directly
          </p>
        </motion.div>
      )}

      {/* Preview Thumbnails Grid */}
      <AnimatePresence>
        {previewDone && Object.keys(previews).length > 0 && (
          <motion.div
            className="previews-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="previews-label">Click any image to view full size</p>
            <div className="previews-grid">
              {STYLES.map((style, i) => (
                <motion.div
                  key={style.id}
                  className={`preview-thumb ${selected === style.id ? "selected" : ""}`}
                  onClick={() => handleThumbClick(style.id)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.03 }}
                >
                  {previews[style.id] ? (
                    <img
                      src={`data:image/jpeg;base64,${previews[style.id]}`}
                      alt={style.name}
                    />
                  ) : (
                    <div className="thumb-placeholder">
                      <div className="thumb-spinner" />
                    </div>
                  )}
                  <div className="thumb-label">
                    <span>{style.name}</span>
                    {selected === style.id && (
                      <span className="thumb-check">✓</span>
                    )}
                  </div>
                  <div className="thumb-zoom-icon">⤢</div>
                </motion.div>
              ))}
            </div>
            <button
              className="regenerate-btn"
              onClick={() => { setPreviewDone(false); setPreviews({}); setSelected(null); }}
            >
              ↺ Regenerate Previews
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullsize Modal */}
      <AnimatePresence>
        {modalStyle && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalStyle(null)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setModalStyle(null)}>✕</button>
              <div className="modal-images">
                <div className="modal-image-wrap">
                  <img src={uploadedImage} alt="Original" />
                  <span className="modal-img-label">Original</span>
                </div>
                <div className="modal-image-wrap">
                  <img
                    src={`data:image/jpeg;base64,${previews[modalStyle]}`}
                    alt={STYLES.find(s => s.id === modalStyle)?.name}
                  />
                  <span className="modal-img-label">
                    {STYLES.find(s => s.id === modalStyle)?.name}
                  </span>
                </div>
              </div>
              <div className="modal-actions">
                <p className="modal-style-name">
                  {STYLES.find(s => s.id === modalStyle)?.desc}
                </p>
                <button
                  className="modal-select-btn"
                  onClick={() => handleSelectFromModal(modalStyle)}
                >
                  Select This Style →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Style Cards Grid */}
      <div className="styles-section-label">
        {previewDone ? "Or select from list:" : "Select a style:"}
      </div>

      <div className="styles-grid">
        {STYLES.map((style, i) => (
          <motion.div
            key={style.id}
            className={`style-card ${selected === style.id ? "selected" : ""}`}
            onClick={() => setSelected(style.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            whileHover={{ y: -4 }}
          >
            <div className="style-icon" style={{ color: style.color }}>{style.emoji}</div>
            <div className="style-info">
              <h3>{style.name}</h3>
              <p>{style.desc}</p>
            </div>
            {selected === style.id && (
              <motion.div
                className="style-check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >✓</motion.div>
            )}
            <div className="style-glow" style={{ background: style.color }} />
          </motion.div>
        ))}
      </div>

      {/* Generate Button */}
      <motion.div
        className="generate-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: selected ? 1 : 0.4 }}
      >
        {selectedPalette && (
          <div className="selected-palette-info">
            <div className="selected-palette-colors">
              {selectedPalette.colors.map((c, i) => (
                <span key={i} style={{ background: c }} className="selected-palette-dot" />
              ))}
            </div>
            <span className="selected-palette-name">{selectedPalette.name} applied</span>
          </div>
        )}
        <button
          className="generate-btn"
          disabled={!selected}
          onClick={() => {
            if (selected) {
              const previewImg = previews[selected]
                ? `data:image/jpeg;base64,${previews[selected]}`
                : null;
              onGenerate(selected, previewImg, selectedPalette);
            }
          }}
        >
          <span>Generate Full Quality</span>
          <span className="btn-arrow">→</span>
        </button>
        {selected && (
          <p className="generate-hint">
            Generating <strong>{STYLES.find(s => s.id === selected)?.name}</strong> at 768x768 resolution
            {selectedPalette && <> with <strong>{selectedPalette.name}</strong> palette</>}
          </p>
        )}
      </motion.div>
    </div>
  );
}