import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./FurnishRoom.css";

const ROOM_TYPES = [
  { id: "living_room", name: "Living Room", icon: "⬜" },
  { id: "bedroom", name: "Bedroom", icon: "◻" },
  { id: "kitchen", name: "Kitchen", icon: "◈" },
  { id: "home_office", name: "Home Office", icon: "◇" },
  { id: "dining_room", name: "Dining Room", icon: "⬡" },
];

const ROOM_FURNITURE = {
  living_room: {
    Seating: ["modern sofa", "sectional couch", "armchair", "accent chair", "chaise lounge", "bean bag", "bench"],
    Tables: ["coffee table", "side table", "console table", "ottoman", "bar cart", "TV unit"],
    Lighting: ["floor lamp", "pendant light", "table lamp", "wall sconce", "chandelier"],
    Decor: ["wall artwork", "mirror", "throw pillows", "area rug", "curtains", "vase", "wall clock"],
    Plants: ["large potted plant", "fiddle leaf fig", "monstera plant", "succulents", "snake plant"],
  },
  bedroom: {
    Seating: ["armchair", "accent chair", "bench at foot of bed", "bean bag"],
    Tables: ["nightstand", "side table", "dresser", "vanity table", "desk"],
    Storage: ["wardrobe", "chest of drawers", "floating shelves", "storage ottoman"],
    Lighting: ["bedside lamp", "floor lamp", "pendant light", "LED strip lights", "wall sconce"],
    Decor: ["wall artwork", "mirror", "throw pillows", "area rug", "curtains", "wall clock"],
    Plants: ["small potted plant", "succulents", "snake plant", "hanging plants"],
  },
  kitchen: {
    Seating: ["bar stool", "kitchen chair", "bench"],
    Tables: ["kitchen island", "dining table", "bar cart", "prep table"],
    Storage: ["open shelving", "kitchen cabinet", "pantry unit", "spice rack"],
    Lighting: ["pendant light over island", "under cabinet lights", "chandelier"],
    Decor: ["fruit bowl", "cookbook display", "wall clock", "kitchen artwork"],
    Plants: ["herb garden", "small potted plant", "succulents"],
  },
  home_office: {
    Seating: ["ergonomic chair", "accent chair", "sofa", "bean bag"],
    Tables: ["standing desk", "L-shaped desk", "side table", "bookshelf"],
    Storage: ["bookshelf", "filing cabinet", "floating shelves", "storage cabinet"],
    Lighting: ["desk lamp", "floor lamp", "LED strip lights", "pendant light"],
    Decor: ["wall artwork", "mirror", "area rug", "curtains", "wall clock", "whiteboard"],
    Plants: ["desk plant", "large potted plant", "succulents", "snake plant"],
  },
  dining_room: {
    Seating: ["dining chairs", "bench seating", "accent chair"],
    Tables: ["dining table", "side table", "bar cart", "buffet table"],
    Storage: ["sideboard", "buffet cabinet", "bar cabinet", "display cabinet"],
    Lighting: ["chandelier", "pendant light", "wall sconce", "floor lamp"],
    Decor: ["wall artwork", "mirror", "area rug", "curtains", "centerpiece vase"],
    Plants: ["large potted plant", "fiddle leaf fig", "small succulents"],
  },
};

const STYLE_PREFERENCES = [
  { id: "modern", name: "Modern", desc: "Clean, minimal, contemporary" },
  { id: "cozy", name: "Cozy", desc: "Warm, comfortable, inviting" },
  { id: "luxury", name: "Luxury", desc: "High-end, elegant, sophisticated" },
  { id: "minimal", name: "Minimal", desc: "Simple, uncluttered, zen" },
  { id: "classic", name: "Classic", desc: "Traditional, timeless, refined" },
  { id: "eclectic", name: "Eclectic", desc: "Mixed, unique, creative" },
];

export default function FurnishRoom({ uploadedImage, onGenerate }) {
  const [roomType, setRoomType] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [stylePreference, setStylePreference] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [customItem, setCustomItem] = useState("");

  const currentCategories = roomType ? ROOM_FURNITURE[roomType] : null;

  const handleRoomSelect = (id) => {
    setRoomType(id);
    setSelectedItems([]);
    setActiveCategory(Object.keys(ROOM_FURNITURE[id])[0]);
  };

  const toggleItem = (item) => {
    setSelectedItems(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const addCustomItem = () => {
    if (customItem.trim() && !selectedItems.includes(customItem.trim())) {
      setSelectedItems(prev => [...prev, customItem.trim()]);
      setCustomItem("");
    }
  };

const buildPrompt = () => {
    const room = ROOM_TYPES.find(r => r.id === roomType)?.name || "room";
    const style = STYLE_PREFERENCES.find(s => s.id === stylePreference);
    const styleAdj = style ? style.name.toLowerCase() + " style " : "";
    const items = selectedItems.join(", ");

    return (
        `${styleAdj}${items}, placed naturally inside this ${room.toLowerCase()}, ` +
        `professionally arranged, bright natural daylight, warm ambient lighting, ` +
        `photorealistic interior photography, 8k, sharp focus`
    );
};

  const handleGenerate = () => {
    if (!roomType || selectedItems.length === 0) return;
    onGenerate("custom", null, null, buildPrompt());
  };

  const canGenerate = roomType && selectedItems.length > 0;

  return (
    <div className="furnish-container">

      {uploadedImage && (
        <div className="furnish-preview">
          <img src={uploadedImage} alt="Your empty room" />
          <div className="furnish-preview-label">Your empty room</div>
        </div>
      )}

      {/* Step 1 — Room Type */}
      <div className="furnish-section">
        <h3 className="furnish-section-title">
          <span className="furnish-step">1</span>
          What type of room is this?
        </h3>
        <div className="furnish-room-types">
          {ROOM_TYPES.map(room => (
            <motion.button
              key={room.id}
              className={`furnish-room-btn ${roomType === room.id ? "active" : ""}`}
              onClick={() => handleRoomSelect(room.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="furnish-room-icon">{room.icon}</span>
              {room.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Step 2 — Furniture */}
      <AnimatePresence>
        {roomType && currentCategories && (
          <motion.div
            className="furnish-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="furnish-section-title">
              <span className="furnish-step">2</span>
              What would you like to add?
            </h3>

            <div className="furnish-categories">
              {Object.keys(currentCategories).map(cat => (
                <button
                  key={cat}
                  className={`furnish-cat-btn ${activeCategory === cat ? "active" : ""}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="furnish-items">
              {currentCategories[activeCategory]?.map(item => (
                <motion.button
                  key={item}
                  className={`furnish-item-btn ${selectedItems.includes(item) ? "selected" : ""}`}
                  onClick={() => toggleItem(item)}
                  whileTap={{ scale: 0.95 }}
                >
                  {selectedItems.includes(item) && <span className="item-check">✓</span>}
                  {item}
                </motion.button>
              ))}
            </div>

            <div className="furnish-custom-input">
              <input
                type="text"
                placeholder="Add custom item..."
                value={customItem}
                onChange={e => setCustomItem(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addCustomItem()}
                className="furnish-custom-field"
              />
              <button
                className="furnish-custom-add"
                onClick={addCustomItem}
                disabled={!customItem.trim()}
              >
                + Add
              </button>
            </div>

            {selectedItems.length > 0 && (
              <motion.div
                className="furnish-selected"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span className="furnish-selected-label">
                  Selected ({selectedItems.length} items):
                </span>
                <div className="furnish-selected-list">
                  {selectedItems.map(item => (
                    <span key={item} className="furnish-selected-chip">
                      {item}
                      <button
                        className="furnish-chip-remove"
                        onClick={() => toggleItem(item)}
                      >✕</button>
                    </span>
                  ))}
                  <button
                    className="furnish-clear-all"
                    onClick={() => setSelectedItems([])}
                  >
                    Clear all
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 3 — Style */}
      <AnimatePresence>
        {roomType && (
          <motion.div
            className="furnish-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="furnish-section-title">
              <span className="furnish-step">3</span>
              Style preference
              <span className="furnish-optional">(optional)</span>
            </h3>
            <div className="furnish-styles">
              {STYLE_PREFERENCES.map(style => (
                <motion.button
                  key={style.id}
                  className={`furnish-style-btn ${stylePreference === style.id ? "active" : ""}`}
                  onClick={() => setStylePreference(
                    stylePreference === style.id ? null : style.id
                  )}
                  whileHover={{ scale: 1.02 }}
                >
                  <span className="furnish-style-name">{style.name}</span>
                  <span className="furnish-style-desc">{style.desc}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt Preview */}
      {canGenerate && (
        <motion.div
          className="furnish-prompt-preview"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="furnish-prompt-label">AI Prompt:</span>
          <p className="furnish-prompt-text">{buildPrompt()}</p>
        </motion.div>
      )}

      {/* Generate Button */}
      <motion.button
        className="furnish-generate-btn"
        disabled={!canGenerate}
        onClick={handleGenerate}
        whileHover={canGenerate ? { scale: 1.02 } : {}}
        whileTap={canGenerate ? { scale: 0.98 } : {}}
      >
        <span>Furnish My Room</span>
        <span className="furnish-btn-arrow">→</span>
      </motion.button>

      {!canGenerate && (
        <p className="furnish-hint">
          {!roomType
            ? "Select a room type to see furniture options"
            : "Select at least one furniture item to continue"}
        </p>
      )}
    </div>
  );
}