import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./ColorPaletteSelector.css";

const PRESET_PALETTES = [
  {
    id: "warm_earth",
    name: "Warm Earth",
    desc: "Terracotta, beige, warm brown",
    colors: ["#C4784A", "#D9B99B", "#8B5E3C", "#F2E4D4", "#6B3F2A"],
    prompt: "warm earth tones, terracotta walls, beige furniture, warm brown wood, sandy cream accents, cozy warm lighting"
  },
  {
    id: "cool_nordic",
    name: "Cool Nordic",
    desc: "White, pale grey, soft blue",
    colors: ["#F0F4F8", "#B8C8D8", "#7A9BB5", "#D4DDE6", "#4A6B8A"],
    prompt: "cool nordic palette, crisp white walls, pale grey furniture, soft blue accents, cool natural light, frost tones"
  },
  {
    id: "luxury_gold",
    name: "Luxury Gold",
    desc: "Black, gold, ivory cream",
    colors: ["#1A1A1A", "#C9A84C", "#F5F0E8", "#8B7355", "#2D2D2D"],
    prompt: "luxury black and gold palette, deep charcoal walls, gold accents and fixtures, ivory cream soft furnishings, dramatic contrast"
  },
  {
    id: "natural_green",
    name: "Natural Green",
    desc: "Sage, forest, warm white",
    colors: ["#7A9B7A", "#4A7A4A", "#B8D4B8", "#F5F2EC", "#2D5A2D"],
    prompt: "natural green palette, sage green walls, forest green plants and accents, warm white furniture, organic natural materials"
  },
  {
    id: "bold_dramatic",
    name: "Bold Dramatic",
    desc: "Deep navy, burgundy, brass",
    colors: ["#1A2744", "#6B1E2E", "#B8924A", "#F0E8D8", "#0D1A33"],
    prompt: "bold dramatic palette, deep navy blue walls, burgundy red accents, brass and bronze fixtures, rich jewel tones"
  },
  {
    id: "pastel_soft",
    name: "Pastel Soft",
    desc: "Blush, lavender, mint",
    colors: ["#F2C4C4", "#C4B8D9", "#B8D9C4", "#F9F0F0", "#D9C4E8"],
    prompt: "soft pastel palette, blush pink accents, lavender purple tones, mint green details, airy light feminine aesthetic"
  },
  {
    id: "moody_dark",
    name: "Moody Dark",
    desc: "Charcoal, slate, copper",
    colors: ["#2D2D2D", "#4A4A5A", "#8B6B4A", "#1A1A2A", "#C4844A"],
    prompt: "moody dark palette, charcoal grey walls, slate blue accents, copper metallic fixtures, dark atmospheric lighting"
  },
  {
    id: "coastal_fresh",
    name: "Coastal Fresh",
    desc: "Ocean blue, sandy white, driftwood",
    colors: ["#4A8BA8", "#F5F0E0", "#C4A87A", "#7AB8D0", "#8B7355"],
    prompt: "coastal fresh palette, ocean blue accents, sandy white walls, driftwood brown furniture, breezy light airy atmosphere"
  }
];

export default function ColorPaletteSelector({ onPaletteChange }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("preset");
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [customColors, setCustomColors] = useState(["#C4784A", "#D9B99B", "#8B5E3C", "#F2E4D4", "#6B3F2A"]);
  const [activeColorIndex, setActiveColorIndex] = useState(null);

  const handlePresetSelect = (palette) => {
    setSelectedPreset(palette.id);
    onPaletteChange({
      type: "preset",
      name: palette.name,
      colors: palette.colors,
      prompt: palette.prompt
    });
  };

  const handleCustomColorChange = (index, value) => {
    const updated = [...customColors];
    updated[index] = value;
    setCustomColors(updated);
    onPaletteChange({
      type: "custom",
      name: "Custom Palette",
      colors: updated,
      prompt: `color palette with these specific colors: ${updated.join(", ")}, matching interior design`
    });
  };

  const handleClear = () => {
    setSelectedPreset(null);
    setCustomColors(["#C4784A", "#D9B99B", "#8B5E3C", "#F2E4D4", "#6B3F2A"]);
    onPaletteChange(null);
  };

  return (
    <div className="cps-wrapper">
      <button
        className={`cps-toggle ${open ? "open" : ""} ${selectedPreset || (mode === "custom") ? "active" : ""}`}
        onClick={() => setOpen(!open)}
      >
        <div className="cps-toggle-left">
          <span className="cps-icon">◉</span>
          <div>
            <span className="cps-toggle-label">Color Palette</span>
            <span className="cps-toggle-sub">
              {selectedPreset
                ? PRESET_PALETTES.find(p => p.id === selectedPreset)?.name
                : "Optional — guide the color scheme"}
            </span>
          </div>
        </div>
        <div className="cps-toggle-right">
          {selectedPreset && (
            <div className="cps-mini-palette">
              {PRESET_PALETTES.find(p => p.id === selectedPreset)?.colors.map((c, i) => (
                <span key={i} className="cps-mini-dot" style={{ background: c }} />
              ))}
            </div>
          )}
          <span className="cps-chevron">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="cps-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="cps-panel-inner">

              {/* Mode Tabs */}
              <div className="cps-tabs">
                <button
                  className={`cps-tab ${mode === "preset" ? "active" : ""}`}
                  onClick={() => setMode("preset")}
                >
                  Preset Themes
                </button>
                <button
                  className={`cps-tab ${mode === "custom" ? "active" : ""}`}
                  onClick={() => setMode("custom")}
                >
                  Custom Colors
                </button>
                {(selectedPreset || mode === "custom") && (
                  <button className="cps-clear" onClick={handleClear}>
                    ✕ Clear
                  </button>
                )}
              </div>

              {/* Preset Palettes */}
              {mode === "preset" && (
                <div className="cps-presets">
                  {PRESET_PALETTES.map((palette) => (
                    <motion.div
                      key={palette.id}
                      className={`cps-preset-item ${selectedPreset === palette.id ? "selected" : ""}`}
                      onClick={() => handlePresetSelect(palette)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="cps-preset-colors">
                        {palette.colors.map((color, i) => (
                          <div
                            key={i}
                            className="cps-preset-color"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="cps-preset-info">
                        <span className="cps-preset-name">{palette.name}</span>
                        <span className="cps-preset-desc">{palette.desc}</span>
                      </div>
                      {selectedPreset === palette.id && (
                        <span className="cps-selected-check">✓</span>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Custom Color Picker */}
              {mode === "custom" && (
                <div className="cps-custom">
                  <p className="cps-custom-label">Pick up to 5 colors for your room:</p>
                  <div className="cps-custom-colors">
                    {customColors.map((color, i) => (
                      <div key={i} className="cps-custom-item">
                        <div
                          className="cps-custom-swatch"
                          style={{ backgroundColor: color }}
                          onClick={() => setActiveColorIndex(i)}
                        >
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => handleCustomColorChange(i, e.target.value)}
                            className="cps-color-input"
                          />
                        </div>
                        <span className="cps-custom-hex">{color.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                  <p className="cps-custom-hint">
                    Click any swatch to change its color
                  </p>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}