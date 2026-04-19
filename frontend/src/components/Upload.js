import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { getApiUrl } from "../config";
import "./Upload.css";

const FEATURES = [
  { icon: "◈", title: "8 Design Styles", desc: "Minimalist, Cyberpunk, Luxury & more" },
  { icon: "⬡", title: "Furnish Rooms", desc: "Add AI-generated furniture instantly" },
  { icon: "◑", title: "Object Editing", desc: "Replace any item with SAM + inpainting" },
  { icon: "✦", title: "Color Palettes", desc: "8 preset themes or custom colors" },
];

const ROOM_TAGS = ["Living Room", "Bedroom", "Kitchen", "Home Office", "Dining Room", "Bathroom"];

export default function Upload({ onUpload }) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const fileRef = useRef();

  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    setUploadDone(false);
    try {
      const formData = new FormData();
      formData.append("image", file);
      await axios.post(`${getApiUrl()}/upload`, formData);
      const dataURL = await new Promise((res) => {
        const r = new FileReader();
        r.onload = (e) => res(e.target.result);
        r.readAsDataURL(file);
      });
      setUploadDone(true);
      onUpload(dataURL);
    } catch (err) {
      // Let parent handle the error via toast
      console.error("Upload failed:", err.message);
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  return (
    <div className="upload-container">

      {/* Drop Zone */}
      <motion.div
        className={`upload-zone ${dragging ? "dragging" : ""} ${preview ? "has-preview" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !preview && fileRef.current.click()}
        whileHover={!preview ? { scale: 1.005, borderColor: "rgba(201,168,76,0.35)" } : {}}
        transition={{ duration: 0.2 }}
      >
        <AnimatePresence mode="wait">
          {!preview ? (
            <motion.div
              key="idle"
              className="upload-idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <motion.div
                className="upload-icon"
                animate={dragging
                  ? { scale: 1.15, y: -6 }
                  : { scale: 1, y: [0, -4, 0] }
                }
                transition={dragging
                  ? { duration: 0.2 }
                  : { duration: 3, repeat: Infinity, ease: "easeInOut" }
                }
              >
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </motion.div>
              <h2>{dragging ? "Drop it here" : "Drop your room photo here"}</h2>
              <p>or click to browse — JPG, PNG, WEBP supported</p>
              <div className="upload-hint">
                <span className="upload-hint-dot">◈</span>
                Works best with clear, well-lit interior photos
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              className="upload-preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <img src={preview} alt="Room preview" />
              <div className="preview-overlay">
                {uploading ? (
                  <div className="upload-spinner-wrap">
                    <div className="upload-spinner" />
                    <span>Uploading…</span>
                  </div>
                ) : (
                  <button
                    className="change-btn"
                    onClick={(e) => { e.stopPropagation(); fileRef.current.click(); }}
                  >
                    ↺ Change Photo
                  </button>
                )}
              </div>
              {uploadDone && (
                <motion.div
                  className="upload-done-badge"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 14, stiffness: 200 }}
                >
                  ✓ Ready
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => processFile(e.target.files[0])}
      />

      {/* Room type tags */}
      <div className="upload-tags">
        {ROOM_TAGS.map((tag, i) => (
          <motion.span
            key={tag}
            className="tag"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.3 }}
          >
            {tag}
          </motion.span>
        ))}
      </div>

      {/* Feature cards */}
      <div className="upload-features">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            className="feature-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07, duration: 0.4 }}
            whileHover={{ y: -3, borderColor: "rgba(201,168,76,0.25)" }}
          >
            <span className="feature-icon">{f.icon}</span>
            <div className="feature-text">
              <span className="feature-title">{f.title}</span>
              <span className="feature-desc">{f.desc}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
