import { useState } from "react";

function BeforeAfterViewer({ originalImage, generatedImage }) {
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleSliderChange = (e) => {
    setSliderPosition(e.target.value);
  };

  return (
    <div>
      {/* Step Label */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold text-sm">
          4
        </div>
        <h2 className="text-xl font-semibold text-white">Before &amp; After</h2>
      </div>

      {/* Slider Viewer */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">

        {/* Image Comparison */}
        <div className="relative w-full h-96 rounded-xl overflow-hidden">

          {/* After (Generated) - Full width background */}
          <img
            src={generatedImage}
            alt="Generated"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Before (Original) - Clipped by slider */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={originalImage}
              alt="Original"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ width: `${10000 / sliderPosition}%`, maxWidth: "none" }}
            />
          </div>

          {/* Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
              <span className="text-gray-800 text-xs font-bold">{"<>"}</span>
            </div>
          </div>

          {/* Labels */}
          <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
            BEFORE
          </div>
          <div className="absolute top-3 right-3 bg-cyan-500/80 text-black text-xs px-2 py-1 rounded-lg font-semibold">
            AFTER
          </div>
        </div>

        {/* Slider Control */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={handleSliderChange}
          className="w-full mt-4 accent-cyan-400"
        />
        <p className="text-gray-500 text-xs text-center mt-1">
          Drag slider to compare before and after
        </p>

       {/* Download Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              const link = document.createElement("a");
              link.href = generatedImage;
              link.download = "ai-interior-design.jpg";
              link.click();
            }}
            className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2 rounded-xl text-sm transition-all border border-gray-700"
          >
            Download Result
          </button>
        </div>
      </div>
    </div>
  );
}

export default BeforeAfterViewer;