/* eslint-disable no-unused-vars */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Upload from "./components/Upload";
import StyleSelector from "./components/StyleSelector";
import ResultView from "./components/ResultView";
import ObjectEditor from "./components/ObjectEditor";
import Auth from "./components/Auth";
import BackendSetup from "./components/BackendSetup";
import { ToastProvider, useToast } from "./components/Toast";
import { API_URL } from "./config";
import "./App.css";

const STEPS = ["upload", "style", "result", "edit"];

const SHORTCUTS = [
  { key: "Ctrl + Z", desc: "Undo last edit" },
  { key: "Ctrl + H", desc: "Toggle history panel" },
  { key: "Ctrl + D", desc: "Download current result" },
  { key: "?",        desc: "Show keyboard shortcuts" },
  { key: "Esc",      desc: "Close any open panel" },
];

function AppInner() {
  const toast = useToast();

  const [step, setStep] = useState("upload");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [editedImage, setEditedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [previousImage, setPreviousImage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("checking");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showBackendSetup, setShowBackendSetup] = useState(false);
  const [apiUrl, setApiUrl] = useState(
    () => localStorage.getItem("interiorai_api_url") || API_URL
  );

  const downloadRef = useRef(null);
  const generatedImageRef = useRef(null);
  const previousImageRef = useRef(null);

  // Keep refs in sync for keyboard shortcut handlers (avoid stale closures)
  useEffect(() => { generatedImageRef.current = generatedImage; }, [generatedImage]);
  useEffect(() => { previousImageRef.current = previousImage; }, [previousImage]);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
    });
    return unsub;
  }, []);

  // Restore history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("interiorai_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
          toast(`Restored ${parsed.length} item${parsed.length > 1 ? "s" : ""} from last session`, "info", 3000);
        }
      }
    } catch { /* ignore corrupt storage */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      try {
        localStorage.setItem("interiorai_history", JSON.stringify(history.slice(0, 8)));
      } catch { /* storage full — ignore */ }
    }
  }, [history]);

  // Connection status polling
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${apiUrl}/health`, {
          signal: AbortSignal.timeout(5000),
        });
        const data = await res.json();
        setConnectionStatus(data.colab_connected ? "full" : "partial");
        setShowBackendSetup(false);
      } catch {
        setConnectionStatus("offline");
        setShowBackendSetup(true);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA";

      if (e.key === "Escape") {
        setShowHistory(false);
        setShowShortcuts(false);
        return;
      }

      if (e.key === "?" && !isTyping && !e.ctrlKey && !e.metaKey) {
        setShowShortcuts(p => !p);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !isTyping) {
        if (e.key === "z") {
          e.preventDefault();
          if (previousImageRef.current) {
            handleUndoKb();
          } else {
            toast("Nothing to undo", "info", 2000);
          }
        }
        if (e.key === "h") {
          e.preventDefault();
          setShowHistory(p => !p);
        }
        if (e.key === "d" && generatedImageRef.current) {
          e.preventDefault();
          downloadRef.current?.();
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registerDownload = useCallback((fn) => {
    downloadRef.current = fn;
  }, []);

  if (!authChecked) return null;
  if (!user) return <Auth onLogin={setUser} />;

  const handleUpload = (imageData) => {
    setUploadedImage(imageData);
    setStep("style");
    toast("Photo uploaded — choose your style!", "success");
  };

  const handleGenerate = async (style, previewImage = null, palette = null, customPrompt = null) => {
    setSelectedStyle(customPrompt ? "custom" : style);
    setLoading(true);
    setLoadingStep(0);
    setLoadingProgress(0);

    if (previewImage) {
      setGeneratedImage(previewImage);
      setStep("result");
    }

    try {
      setLoadingStep(1); setLoadingProgress(10);
      await new Promise(r => setTimeout(r, 500));

      setLoadingStep(2); setLoadingProgress(20);
      await new Promise(r => setTimeout(r, 500));

      setLoadingStep(3); setLoadingProgress(30);

      const res = await fetch(`${apiUrl}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style, palette, customPrompt }),
      });

      setLoadingStep(4); setLoadingProgress(60);

      const data = await res.json();

      if (data.image) {
        setLoadingStep(5); setLoadingProgress(80);
        const imgSrc = "data:image/jpeg;base64," + data.image;
        setGeneratedImage(imgSrc);

        setHistory(prev => [{
          id: Date.now(),
          image: imgSrc,
          original: uploadedImage,
          style: customPrompt ? "custom" : style,
          time: new Date().toLocaleTimeString(),
        }, ...prev]);

        setLoadingStep(6); setLoadingProgress(90);
        if (!previewImage) setStep("result");

        const detectRes = await fetch(`${apiUrl}/detect-objects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const detectData = await detectRes.json();
        setDetectedObjects(detectData.objects || []);

        setLoadingStep(7); setLoadingProgress(100);
        await new Promise(r => setTimeout(r, 400));
        setStep("result");

        toast(`${customPrompt ? "Custom style" : style.replace(/_/g, " ")} applied!`, "success");
      } else {
        toast(data.error || "Generation failed", "error");
      }
    } catch (err) {
      toast("Generation failed — is the backend running?", "error");
    } finally {
      setLoading(false);
      setLoadingStep(0);
      setLoadingProgress(0);
    }
  };

  const handleEdit = async (object, prompt) => {
    setLoading(true);
    setLoadingStep(0);
    setLoadingProgress(0);
    setPreviousImage(generatedImage);

    try {
      setLoadingStep(1); setLoadingProgress(15);
      await new Promise(r => setTimeout(r, 400));

      setLoadingStep(2); setLoadingProgress(35);

      const res = await fetch(`${apiUrl}/edit-object`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ object, prompt }),
      });

      setLoadingStep(3); setLoadingProgress(70);
      const data = await res.json();

      if (data.image) {
        setLoadingStep(4); setLoadingProgress(100);
        await new Promise(r => setTimeout(r, 400));
        const imgSrc = "data:image/jpeg;base64," + data.image;
        setEditedImage(imgSrc);
        setGeneratedImage(imgSrc);
        setStep("edit");
        toast(`${object} edited successfully`, "success");
      } else {
        toast(data.error || "Edit failed", "error");
      }
    } catch (err) {
      toast("Edit failed — check backend connection", "error");
    } finally {
      setLoading(false);
      setLoadingStep(0);
      setLoadingProgress(0);
    }
  };

  const handleUndo = () => {
    if (previousImage) {
      setGeneratedImage(previousImage);
      setEditedImage(previousImage);
      setPreviousImage(null);
      setStep("result");
      toast("Edit undone", "info", 2000);
    }
  };

  const handleUndoKb = () => {
    const prev = previousImageRef.current;
    if (prev) {
      setGeneratedImage(prev);
      setEditedImage(prev);
      setPreviousImage(null);
      setStep("result");
      toast("Edit undone", "info", 2000);
    }
  };

  const handleReset = () => {
    setStep("upload");
    setUploadedImage(null);
    setSelectedStyle(null);
    setGeneratedImage(null);
    setDetectedObjects([]);
    setEditedImage(null);
    setPreviousImage(null);
  };

  const handleBackendConnect = (url, healthData) => {
    setApiUrl(url);
    if (healthData) {
      setConnectionStatus(healthData.colab_connected ? "full" : "partial");
    }
    setShowBackendSetup(false);
    toast(`Connected to ${url}`, "success", 3000);
  };

  const connLabel = { checking: "Checking", full: "Live", partial: "Partial", offline: "Offline" };
  const connTip = {
    checking: "Checking connection...",
    full: "Flask + Colab connected",
    partial: "Flask running — Colab not connected",
    offline: "Click to configure backend URL",
  };

  return (
    <div className="app">
      {/* Backend setup modal */}
      {showBackendSetup && (
        <BackendSetup onConnect={handleBackendConnect} />
      )}

      {/* Ambient background orbs */}
      <div className="ambient-bg" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <header className="header">
        <div className="header-inner">
          <div className="logo" onClick={handleReset}>
            <span className="logo-icon">◈</span>
            <span className="logo-text">Interior<em>AI</em></span>
          </div>

          <div className="step-indicators">
            {["Upload", "Style", "Result", "Edit"].map((s, i) => (
              <div
                key={s}
                className={`step-dot ${STEPS[i] === step ? "active" : ""} ${STEPS.indexOf(step) > i ? "done" : ""}`}
              >
                <span className="step-num">{STEPS.indexOf(step) > i ? "✓" : i + 1}</span>
                <span className="step-label">{s}</span>
              </div>
            ))}
          </div>

          <div className="user-info">
            {/* Connection status */}
            <div
              className={`conn-status conn-${connectionStatus}`}
              title={connTip[connectionStatus]}
              onClick={() => setShowBackendSetup(true)}
              style={{ cursor: "pointer" }}
            >
              <span className="conn-dot" />
              <span className="conn-label">{connLabel[connectionStatus]}</span>
            </div>

            {history.length > 0 && (
              <button className="history-btn" onClick={() => setShowHistory(true)}>
                ◷ History ({history.length})
              </button>
            )}

            {/* Keyboard shortcuts hint */}
            <button
              className="shortcuts-hint-btn"
              onClick={() => setShowShortcuts(true)}
              title="Keyboard shortcuts (?)"
            >
              ⌨
            </button>

            {user.photoURL && (
              <img src={user.photoURL} alt="Profile" className="user-avatar" />
            )}
            <span className="user-name">{user.displayName || user.email}</span>
            <button className="logout-btn" onClick={() => signOut(auth)}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              className="history-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
            />
            <motion.div
              className="history-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="history-header">
                <h2>Generation History</h2>
                <button className="history-close" onClick={() => setShowHistory(false)}>✕</button>
              </div>
              <div className="history-list">
                {history.map((item) => (
                  <motion.div
                    key={item.id}
                    className="history-item"
                    whileHover={{ x: -4 }}
                    onClick={() => {
                      setGeneratedImage(item.image);
                      setUploadedImage(item.original);
                      setSelectedStyle(item.style);
                      setStep("result");
                      setShowHistory(false);
                      toast("Design restored from history", "info", 2000);
                    }}
                  >
                    <div className="history-thumb">
                      <img src={item.image} alt={item.style} />
                    </div>
                    <div className="history-info">
                      <p className="history-style">
                        {item.style.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="history-time">{item.time}</p>
                    </div>
                    <span className="history-arrow">→</span>
                  </motion.div>
                ))}
              </div>
              {history.length > 0 && (
                <div className="history-footer">
                  <button
                    className="clear-history-btn"
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem("interiorai_history");
                      setShowHistory(false);
                      toast("History cleared", "info", 2000);
                    }}
                  >
                    Clear History
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            className="shortcuts-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              className="shortcuts-modal"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 22, stiffness: 250 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="shortcuts-header">
                <span className="shortcuts-icon">⌨</span>
                <h3>Keyboard Shortcuts</h3>
                <button className="shortcuts-close" onClick={() => setShowShortcuts(false)}>✕</button>
              </div>
              <div className="shortcuts-list">
                {SHORTCUTS.map(s => (
                  <div className="shortcut-row" key={s.key}>
                    <kbd className="shortcut-key">{s.key}</kbd>
                    <span className="shortcut-desc">{s.desc}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="loading-content">
              <div className="loading-ring-wrap">
                <div className="loading-ring" />
                <div className="loading-logo-inner">◈</div>
              </div>
              <h2 className="loading-title">
                {loadingStep <= 3 ? "Generating Your Design" :
                  loadingStep <= 5 ? "Finalizing Image" : "Almost Ready"}
              </h2>

              <div className="loading-bar-wrap">
                <motion.div
                  className="loading-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${loadingProgress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
                <motion.div
                  className="loading-bar-glow"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <span className="loading-percent">{loadingProgress}%</span>

              <div className="loading-steps">
                {[
                  "Preparing image",
                  "Analyzing structure",
                  "Edge detection",
                  "Running Stable Diffusion",
                  "Applying ControlNet",
                  "Finalizing",
                  "Detecting objects",
                ].map((label, i) => (
                  <motion.div
                    key={i}
                    className={`loading-step-item ${loadingStep > i + 1 ? "done" : loadingStep === i + 1 ? "active" : ""}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <span className="loading-step-dot">
                      {loadingStep > i + 1 ? "✓" : loadingStep === i + 1 ? "●" : "○"}
                    </span>
                    <span className="loading-step-label">{label}</span>
                  </motion.div>
                ))}
              </div>

              <p className="loading-sub">Powered by Stable Diffusion + ControlNet</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="main">
        <AnimatePresence mode="wait">
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
            >
              <div className="page-header">
                <motion.div
                  className="page-badge"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  ✦ AI-Powered Interior Design
                </motion.div>
                <h1>Transform Your Space</h1>
                <p>Upload a room photo and watch AI reimagine it in any design style</p>
              </div>
              <Upload onUpload={handleUpload} />
            </motion.div>
          )}

          {step === "style" && (
            <motion.div
              key="style"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
            >
              <div className="page-header">
                <h1>Choose Your Style</h1>
                <p>Select a design aesthetic to transform your room</p>
              </div>
              <StyleSelector uploadedImage={uploadedImage} onGenerate={handleGenerate} />
            </motion.div>
          )}

          {(step === "result" || step === "edit") && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
            >
              <div className="page-header">
                <h1>Your Transformed Room</h1>
                <p>
                  {step === "edit"
                    ? "Object replaced with precision using AI inpainting"
                    : `${selectedStyle?.replace(/_/g, " ")} style applied — drag slider to compare`}
                </p>
              </div>
              <ResultView
                original={uploadedImage}
                generated={step === "edit" ? editedImage : generatedImage}
                style={selectedStyle}
                onReset={handleReset}
                onNewStyle={() => setStep("style")}
                onUndo={handleUndo}
                canUndo={!!previousImage}
                onRegisterDownload={registerDownload}
              />
              {step === "result" && detectedObjects.length > 0 && (
                <ObjectEditor objects={detectedObjects} onEdit={handleEdit} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
