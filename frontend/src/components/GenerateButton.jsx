function GenerateButton({ isGenerating, setIsGenerating, selectedStyle, setGeneratedImage, setDetectedObjects }) {

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedImage(null);
    setDetectedObjects([]);

    try {
      // Generate design
      const generateRes = await fetch("/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: selectedStyle }),
      });
      const generateData = await generateRes.json();
      console.log("Generate response:", generateData);

      if (generateData.image) {
        setGeneratedImage(`data:image/jpeg;base64,${generateData.image}`);

        // Detect objects in generated image
        const detectRes = await fetch("/detect-objects", {
          method: "POST",
        });
        const detectData = await detectRes.json();
        if (detectData.objects) {
          setDetectedObjects(detectData.objects);
        }
      }
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      {/* Step Label */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold text-sm">
          3
        </div>
        <h2 className="text-xl font-semibold text-white">Generate Design</h2>
      </div>

      {/* Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className={`w-full py-4 rounded-xl font-semibold text-lg transition-all
          ${isGenerating
            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
            : "bg-cyan-500 hover:bg-cyan-400 text-black cursor-pointer"
          }`}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Generating your design... (~20 seconds)
          </span>
        ) : (
          "✨ Generate Design"
        )}
      </button>

      {/* Info */}
      <p className="text-gray-500 text-sm text-center mt-3">
        AI will transform your room using Stable Diffusion + ControlNet
      </p>
    </div>
  );
}

export default GenerateButton;