import { useState } from "react";

function ObjectEditor({ detectedObjects, selectedStyle, setGeneratedImage }) {
  const [selectedObject, setSelectedObject] = useState("");
  const [isInpainting, setIsInpainting] = useState(false);
  const [inpaintedImage, setInpaintedImage] = useState(null);

  const handleInpaint = async () => {
    if (!selectedObject) return;
    setIsInpainting(true);
    setInpaintedImage(null);

    try {
      const response = await fetch("/inpaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          object: selectedObject,
          style: selectedStyle,
        }),
      });
      const data = await response.json();

      if (data.image) {
        const newImage = `data:image/jpeg;base64,${data.image}`;
        setInpaintedImage(newImage);
        setGeneratedImage(newImage);
      }
    } catch (error) {
      console.error("Inpainting failed:", error);
    } finally {
      setIsInpainting(false);
    }
  };

  return (
    <div>
      {/* Step Label */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold text-sm">
          5
        </div>
        <h2 className="text-xl font-semibold text-white">
          Change a Specific Object
        </h2>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <p className="text-gray-400 text-sm mb-5">
          Select any object from your generated image to redesign it while
          keeping everything else the same.
        </p>

        {/* Dropdown */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-gray-400 text-sm mb-2 block">
              Detected Objects in Your Room
            </label>
            <select
              value={selectedObject}
              onChange={(e) => setSelectedObject(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-cyan-500 transition-all"
            >
              <option value="">-- Select an object to change --</option>
              {detectedObjects.map((obj, index) => (
                <option key={index} value={obj}>
                  {obj}
                </option>
              ))}
            </select>
          </div>

          {/* Regenerate Button */}
          <button
            onClick={handleInpaint}
            disabled={!selectedObject || isInpainting}
            className={`px-6 py-3 rounded-xl font-semibold transition-all
              ${!selectedObject || isInpainting
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-cyan-500 hover:bg-cyan-400 text-black cursor-pointer"
              }`}
          >
            {isInpainting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Regenerating...
              </span>
            ) : (
              "Regenerate Object"
            )}
          </button>
        </div>

        {/* Info about selected object */}
        {selectedObject && !isInpainting && !inpaintedImage && (
          <div className="mt-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-4 py-3">
            <p className="text-cyan-400 text-sm">
              Ready to redesign: <span className="font-semibold">{selectedObject}</span> — everything else will stay identical.
            </p>
          </div>
        )}

        {/* Success message */}
        {inpaintedImage && (
          <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
            <p className="text-green-400 text-sm">
              The <span className="font-semibold">{selectedObject}</span> has been redesigned. Check the Before/After viewer above!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ObjectEditor;