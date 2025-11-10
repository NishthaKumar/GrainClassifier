import os
import base64
import io
import logging

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
from ultralytics import YOLO  # Ultralytics YOLOv8 API

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("grains-server")

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'model.pt')

app = Flask(__name__)
CORS(app)

model = None
model_loaded = False
model_load_error = None

try:
    if os.path.exists(MODEL_PATH):
        logger.info(f"Loading Ultralytics YOLOv8 model from {MODEL_PATH}")
        model = YOLO(MODEL_PATH)
        model_loaded = True
        logger.info("Model loaded successfully.")
    else:
        logger.warning(f"Model file not found at {MODEL_PATH}.")
except Exception as e:
    logger.exception("Failed to load model.")
    model = None
    model_load_error = str(e)

@app.route('/health', methods=['GET'])
def health():
    response = {
        "status": "ok",
        "model_loaded": bool(model_loaded),
    }
    if model_load_error:
        response["model_load_error"] = model_load_error
    return jsonify(response)

def pil_from_base64(b64string):
    img_bytes = base64.b64decode(b64string)
    return Image.open(io.BytesIO(img_bytes)).convert('RGB')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json(force=True)
        image_b64 = data.get('image_base64')
        if not image_b64:
            return jsonify({'error': 'image_base64 is required'}), 400
        if image_b64.startswith('data:'):
            image_b64 = image_b64.split(',', 1)[1]
        pil_img = pil_from_base64(image_b64)

        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500

        results = model.predict(pil_img, verbose=False)
        result = results[0]

        pred_class_idx = result.probs.top1
        pred_class_name = result.names[pred_class_idx]
        confidence = float(result.probs.top1conf)

        response = {
            "predicted_class": pred_class_name,    # Example: "type_2"
            "confidence": confidence               # Example: 0.98
        }
        return jsonify(response)

    except Exception as e:
        logger.exception('Prediction failed')
        return jsonify({'error': 'internal server error', 'details': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
