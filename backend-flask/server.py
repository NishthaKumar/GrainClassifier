import os
import base64
import io
import json
import logging
from typing import Dict

from flask import Flask, request, jsonify
from flask_cors import CORS

import torch
import numpy as np
from PIL import Image

from predict_helpers import (
    CLASS_LABELS,
    CLASS_TO_ATTRIBUTES,
    get_preprocess_transform,
    pil_from_base64,
    make_probabilities_from_label,
)


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("grains-server")


MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'model.pt')

app = Flask(__name__)
CORS(app)


# Choose device: cuda > mps > cpu where available. Using mps for Apple silicon.
if torch.cuda.is_available():
    device = torch.device('cuda')
elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
    device = torch.device('mps')
else:
    device = torch.device('cpu')

model = None
model_loaded = False

try:
    if os.path.exists(MODEL_PATH):
        logger.info(f"Loading model from {MODEL_PATH} to device={device}")
        model = torch.load(MODEL_PATH, map_location=device)
        model.eval()
        model_loaded = True
        logger.info("Model loaded successfully.")
    else:
        logger.warning(f"Model file not found at {MODEL_PATH}. Running in dummy mode.")
        model = None
except Exception as e:
    logger.exception("Failed to load model, running in dummy fallback mode.")
    model = None


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model_loaded": bool(model_loaded)})


def tensor_batch_from_pil(img: Image.Image):
    transform = get_preprocess_transform(224)
    t = transform(img)
    return t.unsqueeze(0)  # add batch dim


@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json(force=True)
        grain_type = (data.get('grain_type') or 'auto').lower()
        image_b64 = data.get('image_base64')
        if not image_b64:
            return jsonify({'error': 'image_base64 is required'}), 400

        # If the frontend already sent a base64 string with data:, strip it
        if image_b64.startswith('data:'):
            image_b64 = image_b64.split(',', 1)[1]

        img_bytes = base64.b64decode(image_b64)
        pil = pil_from_base64(img_bytes)
        input_tensor = tensor_batch_from_pil(pil)

        # If a real model is available and user asked for auto -> run inference
        if model is not None and grain_type == 'auto':
            with torch.no_grad():
                inp = input_tensor.to(device)
                try:
                    out = model(inp)
                except Exception:
                    # try calling model with CPU tensors if device mismatch
                    out = model(input_tensor)

                out_np = None
                if isinstance(out, torch.Tensor):
                    out = out.cpu()
                    # If model outputs single logit per batch (binary)
                    if out.dim() == 1 or (out.dim() == 2 and out.size(1) == 1):
                        # binary: treat as probability of 'toor'
                        score = torch.sigmoid(out.view(-1)).item()
                        predicted = 'toor' if score >= 0.5 else 'unknown'
                        probs = {lbl: 0.0 for lbl in CLASS_LABELS}
                        # place toor probability := score, distribute rest
                        probs['toor'] = round(float(score), 4)
                        remaining = 1.0 - probs['toor']
                        per_other = round(remaining / (len(CLASS_LABELS) - 1), 4)
                        for lbl in CLASS_LABELS:
                            if lbl != 'toor':
                                probs[lbl] = per_other
                        confidence = probs.get(predicted, 0.0)
                    else:
                        # multi-class logits
                        import torch.nn.functional as F

                        logits = out.view(out.size(0), -1)
                        probs_tensor = F.softmax(logits, dim=1)
                        top_p, top_idx = torch.topk(probs_tensor, 1, dim=1)
                        top_idx = int(top_idx[0, 0].item())
                        predicted = CLASS_LABELS[top_idx] if top_idx < len(CLASS_LABELS) else 'unknown'
                        probs = {lbl: float(round(p, 4)) for lbl, p in zip(CLASS_LABELS, probs_tensor[0].tolist())}
                        confidence = probs.get(predicted, 0.0)

                else:
                    # model returned unexpected output; fallback
                    predicted = 'toor'
                    probs = make_probabilities_from_label(predicted)
                    confidence = probs.get(predicted, 0.0)

                attributes = CLASS_TO_ATTRIBUTES.get(predicted, CLASS_TO_ATTRIBUTES['toor'])
                return jsonify({
                    'predicted_class': predicted,
                    'confidence': float(confidence),
                    'probabilities': probs,
                    'attributes': attributes,
                })

        # If model is missing or user selected a specific grain, return simulated/dummy response
        # If user selected a grain type other than 'auto', pretend the prediction is that type.
        if grain_type != 'auto':
            predicted = grain_type if grain_type in CLASS_LABELS else 'unknown'
        else:
            # auto + no model -> assume toor with medium confidence
            predicted = 'toor'

        probs = make_probabilities_from_label(predicted)
        confidence = probs.get(predicted, 0.0)
        attributes = CLASS_TO_ATTRIBUTES.get(predicted, CLASS_TO_ATTRIBUTES['toor'])

        return jsonify({
            'predicted_class': predicted,
            'confidence': float(confidence),
            'probabilities': probs,
            'attributes': attributes,
        })

    except Exception as e:
        logger.exception('Prediction failed')
        return jsonify({'error': 'internal server error', 'details': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    # Bind to 0.0.0.0 so mobile device can reach it on LAN
    app.run(host='0.0.0.0', port=port, debug=False)
