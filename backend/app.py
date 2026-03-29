from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import os
import base64
import io
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

COLAB_URL = {"url": None}

COLAB_HEADERS = {
    "ngrok-skip-browser-warning": "true",
    "Content-Type": "application/json"
}

def image_to_base64(image_path):
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def base64_to_image(b64_string, save_path):
    img_data = base64.b64decode(b64_string)
    img = Image.open(io.BytesIO(img_data))
    img.save(save_path)
    return save_path

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "Flask is running",
        "colab_connected": COLAB_URL["url"] is not None,
        "colab_url": COLAB_URL["url"]
    })

@app.route('/set-colab-url', methods=['POST'])
def set_colab_url():
    data = request.json
    url = data.get("url")
    if not url:
        return jsonify({"error": "No URL provided"}), 400
    COLAB_URL["url"] = url.rstrip("/")
    print(f"✅ Colab URL set: {COLAB_URL['url']}")
    return jsonify({"message": "Colab URL registered", "url": COLAB_URL["url"]})

@app.route('/upload', methods=['POST'])
def upload():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400
    save_path = os.path.join(UPLOAD_FOLDER, 'room_original.jpg')
    img = Image.open(file).convert("RGB")
    img = img.resize((512, 512))
    img.save(save_path)
    return jsonify({
        "message": "Image uploaded successfully",
        "path": save_path
    })

@app.route('/generate', methods=['POST'])
def generate():
    if not COLAB_URL["url"]:
        return jsonify({"error": "Colab not connected"}), 503
    data = request.json
    style = data.get("style")
    palette = data.get("palette")
    if not style:
        return jsonify({"error": "No style provided"}), 400
    upload_path = os.path.join(UPLOAD_FOLDER, 'room_original.jpg')
    if not os.path.exists(upload_path):
        return jsonify({"error": "No uploaded image found"}), 400
    image_b64 = image_to_base64(upload_path)
    try:
        response = requests.post(
            f"{COLAB_URL['url']}/colab-generate",
            json={"image": image_b64, "style": style, "palette": palette},
            headers=COLAB_HEADERS,
            timeout=120
        )
        result = response.json()
    except Exception as e:
        return jsonify({"error": f"Colab request failed: {str(e)}"}), 500
    if "image" not in result:
        return jsonify({"error": "Colab did not return an image", "details": result}), 500
    output_path = os.path.join(OUTPUT_FOLDER, 'room_styled.jpg')
    base64_to_image(result["image"], output_path)
    return jsonify({
        "message": "Style transfer complete",
        "style": style,
        "image": result["image"]
    })

@app.route('/detect-objects', methods=['POST'])
def detect_objects():
    if not COLAB_URL["url"]:
        return jsonify({"error": "Colab not connected"}), 503
    styled_path = os.path.join(OUTPUT_FOLDER, 'room_styled.jpg')
    if not os.path.exists(styled_path):
        return jsonify({"error": "No styled image found"}), 400
    image_b64 = image_to_base64(styled_path)
    try:
        response = requests.post(
            f"{COLAB_URL['url']}/colab-detect",
            json={"image": image_b64},
            headers=COLAB_HEADERS,
            timeout=60
        )
        result = response.json()
    except Exception as e:
        return jsonify({"error": f"Colab request failed: {str(e)}"}), 500
    return jsonify({
        "message": "Detection complete",
        "objects": result.get("objects", [])
    })

@app.route('/preview-styles', methods=['POST'])
def preview_styles():
    if not COLAB_URL["url"]:
        return jsonify({"error": "Colab not connected"}), 503

    upload_path = os.path.join(UPLOAD_FOLDER, 'room_original.jpg')
    if not os.path.exists(upload_path):
        return jsonify({"error": "No uploaded image found"}), 400

    data = request.json or {}
    palette = data.get("palette")
    image_b64 = image_to_base64(upload_path)

    try:
        response = requests.post(
            f"{COLAB_URL['url']}/colab-preview",
            json={"image": image_b64, "palette": palette},
            headers=COLAB_HEADERS,
            timeout=300
        )
        result = response.json()
    except Exception as e:
        return jsonify({"error": f"Colab request failed: {str(e)}"}), 500

    return jsonify({
        "message": "Previews generated",
        "previews": result.get("previews", {})
    })


@app.route('/edit-object', methods=['POST'])
def edit_object():
    if not COLAB_URL["url"]:
        return jsonify({"error": "Colab not connected"}), 503
    data = request.json
    object_label = data.get("object")
    edit_prompt = data.get("prompt")
    if not object_label or not edit_prompt:
        return jsonify({"error": "object and prompt required"}), 400
    edited_path = os.path.join(OUTPUT_FOLDER, 'room_edited.jpg')
    styled_path = os.path.join(OUTPUT_FOLDER, 'room_styled.jpg')
    if os.path.exists(edited_path):
        image_b64 = image_to_base64(edited_path)
        print("Using previous edit as base")
    elif os.path.exists(styled_path):
        image_b64 = image_to_base64(styled_path)
        print("Using styled image as base")
    else:
        return jsonify({"error": "No image found. Generate a style first."}), 400
    try:
        response = requests.post(
            f"{COLAB_URL['url']}/colab-edit",
            json={
                "image": image_b64,
                "object": object_label,
                "prompt": edit_prompt
            },
            headers=COLAB_HEADERS,
            timeout=120
        )
        result = response.json()
    except Exception as e:
        return jsonify({"error": f"Colab request failed: {str(e)}"}), 500
    if "image" not in result:
        return jsonify({"error": "Colab did not return an image", "details": result}), 500
    output_path = os.path.join(OUTPUT_FOLDER, 'room_edited.jpg')
    base64_to_image(result["image"], output_path)
    return jsonify({
        "message": "Object edit complete",
        "object": object_label,
        "image": result["image"]
    })

if __name__ == '__main__':
    print("🚀 AI Interior Designer v2 - Flask API")
    print("📍 Running at: http://localhost:5000")
    app.run(debug=True, port=5000)