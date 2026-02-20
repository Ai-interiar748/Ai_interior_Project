import { useState } from "react";
import UploadSection from "./components/UploadSection";
import StyleSelector from "./components/StyleSelector";
import GenerateButton from "./components/GenerateButton";
import BeforeAfterViewer from "./components/BeforeAfterViewer";
import ObjectEditor from "./components/ObjectEditor";

function App() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [roomMode, setRoomMode] = useState(null); // "furnished" or "empty"

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      
      {/* Header */}
      <header className="border-b border-gray-800 py-5 px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-cyan-400">
              🏠 AI Interior Designer
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Transform any room with AI
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-gray-400 text-sm">Flask Connected</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-8 py-10 space-y-10">

        {/* Step 1 - Upload */}
        <UploadSection
          uploadedImage={uploadedImage}
          setUploadedImage={setUploadedImage}
          setRoomMode={setRoomMode}
          roomMode={roomMode}
        />

        {/* Step 2 - Style Selector (shows after upload) */}
        {uploadedImage && (
          <StyleSelector
            selectedStyle={selectedStyle}
            setSelectedStyle={setSelectedStyle}
          />
        )}

        {/* Step 3 - Generate Button (shows after style selected) */}
        {uploadedImage && selectedStyle && (
          <GenerateButton
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            selectedStyle={selectedStyle}
            setGeneratedImage={setGeneratedImage}
            setDetectedObjects={setDetectedObjects}
          />
        )}

        {/* Step 4 - Before/After Viewer (shows after generation) */}
        {generatedImage && (
          <BeforeAfterViewer
            originalImage={uploadedImage}
            generatedImage={generatedImage}
          />
        )}

        {/* Step 5 - Object Editor (shows after generation) */}
        {generatedImage && detectedObjects.length > 0 && (
          <ObjectEditor
            detectedObjects={detectedObjects}
            selectedStyle={selectedStyle}
            setGeneratedImage={setGeneratedImage}
          />
        )}

      </main>
    </div>
  );
}

export default App;