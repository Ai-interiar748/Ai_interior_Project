import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./BackendSetup.css";

const MODES = [
  {
    id: "colab",
    icon: "⚡",
    label: "Google Colab",
    desc: "Paste your ngrok URL from Colab",
    placeholder: "https://xxxx-xxxx.ngrok-free.app",
    defaultVal: "",
  },
  {
    id: "local",
    icon: "💻",
    label: "Local Dev",
    desc: "Running Flask on your machine",
    placeholder: "http://localhost:5000",
    defaultVal: "http://localhost:5000",
  },
];

export default function BackendSetup({ onConnect }) {
  const saved = localStorage.getItem("interiorai_api_url") || "";
  const guessMode = saved && !saved.includes("localhost") ? "colab" : "colab";

  const [mode, setMode] = useState(guessMode);
  const [url, setUrl] = useState(saved);
  const [status, setStatus] = useState("idle"); // idle | testing | ok | error
  const [errorMsg, setErrorMsg] = useState("");

  const selectedMode = MODES.find(m => m.id === mode);

  const handleModeSwitch = (m) => {
    setMode(m.id);
    setUrl(m.defaultVal);
    setStatus("idle");
    setErrorMsg("");
  };

  const handleConnect = async () => {
    const clean = url.trim().replace(/\/$/, "");
    if (!clean) {
      setErrorMsg("Please enter a URL first.");
      return;
    }
    setStatus("testing");
    setErrorMsg("");
    try {
      const res = await fetch(`${clean}/health`, {
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json();
      if (data.status === "ok" || data.colab_connected !== undefined) {
        localStorage.setItem("interiorai_api_url", clean);
        setStatus("ok");
        setTimeout(() => onConnect(clean, data), 700);
      } else {
        throw new Error("Unexpected response");
      }
    } catch {
      setStatus("error");
      setErrorMsg(
        mode === "colab"
          ? "Could not reach Colab. Make sure all cells are running and the URL is correct."
          : "Could not reach local Flask. Run: python app.py in the backend folder."
      );
    }
  };

  const handleSkip = () => {
    const clean = url.trim().replace(/\/$/, "") || "http://localhost:5000";
    localStorage.setItem("interiorai_api_url", clean);
    onConnect(clean, null);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="bsetup-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bsetup-modal"
          initial={{ scale: 0.88, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 24 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
        >
          <div className="bsetup-icon">◈</div>
          <h2 className="bsetup-title">Connect AI Backend</h2>

          {/* Mode toggle */}
          <div className="bsetup-modes">
            {MODES.map(m => (
              <button
                key={m.id}
                className={`bsetup-mode-btn ${mode === m.id ? "active" : ""}`}
                onClick={() => handleModeSwitch(m)}
              >
                <span className="bsetup-mode-icon">{m.icon}</span>
                <span className="bsetup-mode-label">{m.label}</span>
              </button>
            ))}
          </div>

          <p className="bsetup-desc">{selectedMode.desc}</p>

          {/* Colab steps hint */}
          {mode === "colab" && (
            <motion.div
              className="bsetup-steps"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <div className="bsetup-step"><span className="bsetup-step-n">1</span>Run all cells in your Colab notebook</div>
              <div className="bsetup-step"><span className="bsetup-step-n">2</span>Copy the <strong>ngrok URL</strong> from the last cell output</div>
              <div className="bsetup-step"><span className="bsetup-step-n">3</span>Paste it below and click Connect</div>
            </motion.div>
          )}

          {/* URL input */}
          <div className="bsetup-input-wrap">
            <input
              className={`bsetup-input ${status === "error" ? "bsetup-input-error" : status === "ok" ? "bsetup-input-ok" : ""}`}
              type="url"
              value={url}
              onChange={e => { setUrl(e.target.value); setStatus("idle"); setErrorMsg(""); }}
              onKeyDown={e => e.key === "Enter" && handleConnect()}
              placeholder={selectedMode.placeholder}
              spellCheck={false}
              autoFocus={mode === "colab"}
            />
            {status === "ok" && <span className="bsetup-check">✓</span>}
          </div>

          {errorMsg && (
            <motion.p
              className="bsetup-error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errorMsg}
            </motion.p>
          )}

          <div className="bsetup-actions">
            <button
              className="bsetup-btn-connect"
              onClick={handleConnect}
              disabled={status === "testing" || status === "ok"}
            >
              {status === "testing" ? (
                <><span className="bsetup-spinner" /> Testing connection…</>
              ) : status === "ok" ? (
                "✓ Connected!"
              ) : (
                "Connect"
              )}
            </button>
            <button className="bsetup-btn-skip" onClick={handleSkip}>
              Skip for now
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
