from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import os
import requests

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Colab URL will be updated here when ngrok is running
COLAB_URL = None

# ─────────────────────────────────────────
# 1. STATUS CHECK
# ─────────────────────────────────────────
@app.route('/')
def home():
    return jsonify({
        "status": "running",
        "message": "AI Interior Designer API",
        "colab_connected": COLAB_URL is not None
    })

# ─────────────────────────────────────────
# 2. SET COLAB URL (called once ngrok is up)
# ─────────────────────────────────────────
@app.route('/set-colab-url', methods=['POST'])
def set_colab_url():
    global COLAB_URL
    data = request.json
    COLAB_URL = data.get('url')
    return jsonify({
        "message": "Colab URL updated",
        "url": COLAB_URL
    })

# ─────────────────────────────────────────
# 3. UPLOAD IMAGE
# ─────────────────────────────────────────
@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    filepath = os.path.join(UPLOAD_FOLDER, 'room.jpg')
    img = Image.open(file)
    img = img.resize((512, 512))
    img.save(filepath)

    return jsonify({
        "message": "Image uploaded successfully",
        "filepath": filepath
    })

# ─────────────────────────────────────────
# 4. GET STYLES
# ─────────────────────────────────────────
@app.route('/styles', methods=['GET'])
def get_styles():
    styles = [
        {"id": "minimalist",       "name": "Minimalist",       "emoji": "🤍"},
        {"id": "industrial",       "name": "Industrial",       "emoji": "🏭"},
        {"id": "cyberpunk",        "name": "Cyberpunk",        "emoji": "🌆"},
        {"id": "modern_luxury",    "name": "Modern Luxury",    "emoji": "👑"},
        {"id": "scandinavian",     "name": "Scandinavian",     "emoji": "🌿"},
        {"id": "midcentury_modern","name": "Mid-Century",      "emoji": "🕰️"},
        {"id": "japanese_zen",     "name": "Japanese Zen",     "emoji": "🎋"},
        {"id": "bohemian",         "name": "Bohemian",         "emoji": "🌸"},
    ]
    return jsonify(styles)

# ─────────────────────────────────────────
# 5. DETECT ROOM TYPE (empty or furnished)
# ─────────────────────────────────────────
@app.route('/detect-room', methods=['POST'])
def detect_room():
    if not COLAB_URL:
        return jsonify({"error": "Colab not connected"}), 503

    with open(os.path.join(UPLOAD_FOLDER, 'room.jpg'), 'rb') as f:
        response = requests.post(
            f"{COLAB_URL}/detect-room",
            files={"image": f}
        )
    return jsonify(response.json())

# ─────────────────────────────────────────
# 6. GENERATE DESIGN
# ─────────────────────────────────────────
@app.route('/generate', methods=['POST'])
def generate_design():
    if not COLAB_URL:
        return jsonify({"error": "Colab not connected"}), 503

    data = request.json
    style = data.get('style', 'minimalist')
    mode = data.get('mode', 'style_transfer')  # style_transfer or furnish

    with open(os.path.join(UPLOAD_FOLDER, 'room.jpg'), 'rb') as f:
        response = requests.post(
            f"{COLAB_URL}/generate",
            files={"image": f},
            data={"style": style, "mode": mode}
        )

    result = response.json()

    # Save output image
    if "image" in result:
        import base64
        img_data = base64.b64decode(result["image"])
        output_path = os.path.join(OUTPUT_FOLDER, 'generated.jpg')
        with open(output_path, 'wb') as out:
            out.write(img_data)

    return jsonify(result)

# ─────────────────────────────────────────
# 7. DETECT OBJECTS IN GENERATED IMAGE
# ─────────────────────────────────────────
@app.route('/detect-objects', methods=['POST'])
def detect_objects():
    if not COLAB_URL:
        return jsonify({"error": "Colab not connected"}), 503

    with open(os.path.join(OUTPUT_FOLDER, 'generated.jpg'), 'rb') as f:
        response = requests.post(
            f"{COLAB_URL}/detect-objects",
            files={"image": f}
        )
    return jsonify(response.json())

# ─────────────────────────────────────────
# 8. INPAINT (change single object)
# ─────────────────────────────────────────
@app.route('/inpaint', methods=['POST'])
def inpaint():
    if not COLAB_URL:
        return jsonify({"error": "Colab not connected"}), 503

    data = request.json
    selected_object = data.get('object')
    style = data.get('style', 'minimalist')

    with open(os.path.join(OUTPUT_FOLDER, 'generated.jpg'), 'rb') as f:
        response = requests.post(
            f"{COLAB_URL}/inpaint",
            files={"image": f},
            data={"object": selected_object, "style": style}
        )

    return jsonify(response.json())

# ─────────────────────────────────────────
if __name__ == '__main__':
    print("🚀 AI Interior Designer API Starting...")
    print("📍 Running on http://localhost:5000")
    app.run(debug=True, port=5000)