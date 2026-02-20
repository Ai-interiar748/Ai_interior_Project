import { useState } from "react";

function UploadSection({ uploadedImage, setUploadedImage, setRoomMode, roomMode }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setUploadedImage(e.target.result);
    reader.readAsDataURL(file);

    // Send to Flask
    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log("Upload success:", data);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  return (
    <div>
      {/* Step Label */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold text-sm">
          1
        </div>
        <h2 className="text-xl font-semibold text-white">Upload Your Room</h2>
      </div>

      {/* Upload Area */}
      {!uploadedImage ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer
            ${isDragging
              ? "border-cyan-400 bg-cyan-400/10"
              : "border-gray-700 bg-gray-900 hover:border-cyan-600 hover:bg-gray-800"
            }`}
        >
          <div className="text-6xl mb-4">📸</div>
          <p className="text-white text-lg font-medium mb-2">
            Drag & drop your room photo here
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Supports JPG, PNG, WEBP
          </p>
          <label className="cursor-pointer bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-6 py-3 rounded-xl transition-all">
            Browse File
            <input
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        /* Preview After Upload */
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-start gap-6">
            <img
              src={uploadedImage}
              alt="Uploaded room"
              className="w-48 h-48 object-cover rounded-xl"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-white font-medium">
                  Room uploaded successfully
                </span>
              </div>
              {isUploading && (
                <p className="text-cyan-400 text-sm animate-pulse">
                  Sending to server...
                </p>
              )}
              {roomMode && (
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mt-2
                  ${roomMode === "empty"
                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                    : "bg-green-500/20 text-green-400 border border-green-500/30"
                  }`}>
                  {roomMode === "empty" ? "🏚️ Empty Room Detected" : "🛋️ Furnished Room Detected"}
                </div>
              )}
              <button
                onClick={() => { setUploadedImage(null); setRoomMode(null); }}
                className="mt-4 text-gray-400 hover:text-red-400 text-sm transition-colors"
              >
                ✕ Remove and upload different image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadSection;