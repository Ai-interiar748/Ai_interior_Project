import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./BackendSetup.css";

export default function BackendSetup({ onConnect }) {
  const saved = localStorage.getItem("interiorai_api_url") || "http://localhost:5000";
  const [url, setUrl] = useState(saved);
  const [status, setStatus] = useState("idle"); // idle | testing | ok | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleConnect = async () => {
    const clean = url.trim().replace(/\/$/, "");
    if (!clean) return;
    setStatus("testing");
    setErrorMsg("");
    try {
      const res = await fetch(`${clean}/health`, {
        signal: AbortSignal.timeout(7000),
      });
      const data = await res.json();
      if (data.status === "ok" || data.colab_connected !== undefined) {
        localStorage.setItem("interiorai_api_url", clean);
        setStatus("ok");
        setTimeout(() => onConnect(clean, data), 600);
      } else {
        throw new Error("Unexpected response");
      }
    } catch (e) {
      setStatus("error");
      setErrorMsg("Could not reach backend. Check the URL and try again.");
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
          <h2 className="bsetup-title">Connect Backend</h2>
          <p className="bsetup-desc">
            Enter your backend URL to enable AI generation.<br />
            Use <code>http://localhost:5000</code> for local dev or your Render / ngrok URL.
          </p>

          <div className="bsetup-input-wrap">
            <input
              className={`bsetup-input ${status === "error" ? "bsetup-input-error" : status === "ok" ? "bsetup-input-ok" : ""}`}
              type="url"
              value={url}
              onChange={e => { setUrl(e.target.value); setStatus("idle"); }}
              onKeyDown={e => e.key === "Enter" && handleConnect()}
              placeholder="https://your-backend.onrender.com"
              spellCheck={false}
            />
            {status === "ok" && <span className="bsetup-check">✓</span>}
          </div>

          {errorMsg && (
            <motion.p
              className="bsetup-error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errorMsg}
            </motion.p>
          )}

          <div className="bsetup-hints">
            <button className="bsetup-hint-btn" onClick={() => setUrl("http://localhost:5000")}>
              Local
            </button>
            <button className="bsetup-hint-btn" onClick={() => setUrl("")}>
              Clear
            </button>
          </div>

          <div className="bsetup-actions">
            <button
              className="bsetup-btn-connect"
              onClick={handleConnect}
              disabled={status === "testing" || status === "ok"}
            >
              {status === "testing" ? (
                <span className="bsetup-spinner" />
              ) : status === "ok" ? (
                "Connected!"
              ) : (
                "Connect"
              )}
            </button>
            <button className="bsetup-btn-skip" onClick={handleSkip}>
              Skip for now
            </button>
          </div>

          <p className="bsetup-footer">
            Don't have a backend? See the <strong>Instruction</strong> file for Render setup.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
