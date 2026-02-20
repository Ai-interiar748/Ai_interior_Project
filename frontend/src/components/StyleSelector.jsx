import { useState, useEffect } from "react";

function StyleSelector({ selectedStyle, setSelectedStyle }) {
  const [styles, setStyles] = useState([]);

  useEffect(() => {
    fetch("/styles")
      .then((res) => res.json())
      .then((data) => setStyles(data))
      .catch((err) => console.error("Failed to fetch styles:", err));
  }, []);

  return (
    <div>
      {/* Step Label */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold text-sm">
          2
        </div>
        <h2 className="text-xl font-semibold text-white">Choose a Design Style</h2>
      </div>

      {/* Style Cards */}
      <div className="grid grid-cols-4 gap-4">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => setSelectedStyle(style.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all
              ${selectedStyle === style.id
                ? "border-cyan-400 bg-cyan-400/10"
                : "border-gray-700 bg-gray-900 hover:border-gray-500 hover:bg-gray-800"
              }`}
          >
            <div className="text-3xl mb-2">{style.emoji}</div>
            <div className="text-white font-medium text-sm">{style.name}</div>
            {selectedStyle === style.id && (
              <div className="text-cyan-400 text-xs mt-1">✓ Selected</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default StyleSelector;