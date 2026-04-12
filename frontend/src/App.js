/* eslint-disable no-unused-vars */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Upload from "./components/Upload";
import StyleSelector from "./components/StyleSelector";
import ResultView from "./components/ResultView";
import ObjectEditor from "./components/ObjectEditor";
import Auth from "./components/Auth";
import "./App.css";

const STEPS = ["upload", "style", "result", "edit"];

export default function App() {
  const [step, setStep] = useState("upload");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [editedImage, setEditedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [previousImage, setPreviousImage] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
    });
    return unsub;
  }, []);

  if (!authChecked) return null;
  if (!user) return <Auth onLogin={setUser} />;

  const handleUpload = (imageData) => {
    setUploadedImage(imageData);
    setStep("style");
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
      setLoadingStep(1);
      setLoadingProgress(10);
      await new Promise(r => setTimeout(r, 500));

      setLoadingStep(2);
      setLoadingProgress(20);
      await new Promise(r => setTimeout(r, 500));

      setLoadingStep(3);
      setLoadingProgress(30);

      const res = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style, palette, customPrompt }),
      });

      setLoadingStep(4);
      setLoadingProgress(60);

      const data = await res.json();

      if (data.image) {
        setLoadingStep(5);
        setLoadingProgress(80);
        setGeneratedImage("data:image/jpeg;base64," + data.image);

        setHistory(prev => [{
          id: Date.now(),
          image: "data:image/jpeg;base64," + data.image,
          original: uploadedImage,
          style: customPrompt ? "custom" : style,
          time: new Date().toLocaleTimeString()
        }, ...prev]);

        setLoadingStep(6);
        setLoadingProgress(90);
        if (!previewImage) setStep("result");

        const detectRes = await fetch("http://localhost:5000/detect-objects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const detectData = await detectRes.json();
        setDetectedObjects(detectData.objects || []);

        setLoadingStep(7);
        setLoadingProgress(100);
        await new Promise(r => setTimeout(r, 500));
        setStep("result");
      }
    } catch (err) {
      alert("Generation failed: " + err.message);
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

    // Save current image before editing for undo
    setPreviousImage(generatedImage);

    try {
      setLoadingStep(1);
      setLoadingProgress(15);
      await new Promise(r => setTimeout(r, 400));

      setLoadingStep(2);
      setLoadingProgress(35);

      const res = await fetch("http://localhost:5000/edit-object", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ object, prompt }),
      });

      setLoadingStep(3);
      setLoadingProgress(70);
      const data = await res.json();

      if (data.image) {
        setLoadingStep(4);
        setLoadingProgress(100);
        await new Promise(r => setTimeout(r, 400));
        setEditedImage("data:image/jpeg;base64," + data.image);
        setGeneratedImage("data:image/jpeg;base64," + data.image);
        setStep("edit");
      }
    } catch (err) {
      alert("Edit failed: " + err.message);
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

  return (
    <div className="app">
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
                className={`step-dot ${STEPS[i] === step ? "active" : ""} ${STEPS.indexOf(step) > i ? "done" : ""
                  }`}
              >
                <span className="step-num">{i + 1}</span>
                <span className="step-label">{s}</span>
              </div>
            ))}
          </div>
          <div className="user-info">
            {history.length > 0 && (
              <button
                className="history-btn"
                onClick={() => setShowHistory(true)}
              >
                ◷ History ({history.length})
              </button>
            )}
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
                <button
                  className="history-close"
                  onClick={() => setShowHistory(false)}
                >✕</button>
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
                      setShowHistory(false);
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
              <div className="loading-logo">◈</div>
              <h2 className="loading-title">
                {loadingStep <= 3 ? "Generating Your Design" :
                  loadingStep <= 5 ? "Finalizing Image" :
                    "Almost Ready"}
              </h2>

              {/* Progress Bar */}
              <div className="loading-bar-wrap">
                <motion.div
                  className="loading-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${loadingProgress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <span className="loading-percent">{loadingProgress}%</span>

              {/* Step Indicators */}
              <div className="loading-steps">
                {[
                  "Preparing image",
                  "Analyzing structure",
                  "Edge detection",
                  "Running Stable Diffusion",
                  "Applying ControlNet",
                  "Finalizing",
                  "Detecting objects"
                ].map((label, i) => (
                  <motion.div
                    key={i}
                    className={`loading-step-item ${loadingStep > i + 1 ? "done" :
                        loadingStep === i + 1 ? "active" : ""
                      }`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <span className="loading-step-dot">
                      {loadingStep > i + 1 ? "✓" :
                        loadingStep === i + 1 ? "●" : "○"}
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
              <StyleSelector
                uploadedImage={uploadedImage}
                onGenerate={handleGenerate}
              />
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
                    : `${selectedStyle} style applied — drag slider to compare`}
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
              />
              {step === "result" && detectedObjects.length > 0 && (
                <ObjectEditor
                  objects={detectedObjects}
                  onEdit={handleEdit}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}