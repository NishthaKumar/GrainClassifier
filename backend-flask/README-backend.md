# GrainClassifier Backend (Flask)

This backend serves a PyTorch model (if present) and provides a safe dummy fallback so frontend work can continue without the model file.

Files:
- `server.py` — Flask app with `/health` and `/predict` endpoints.
- `predict_helpers.py` — labels, attributes and image preprocessing.
- `model/model.pt` — NOT included. Place your trained PyTorch model here (optional).
- `requirements.txt` — Python dependencies.

Quick start (macOS / Linux):

1. Create and activate a virtualenv (optional but recommended):

```bash
python3 -m venv venv
source venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

If you are on an Apple M1/M2 chip, follow the instructions on https://pytorch.org/get-started/locally/ to install the correct wheel. The `requirements.txt` contains a note.

3. Run the server (default port 5001):

```bash
PORT=5001 python server.py
```

Tip: To test from your phone using Expo Go, find your machine IP (example for Wi-Fi interface en0):

```bash
ipconfig getifaddr en0
```

Replace the SERVER_URL in the frontend app with `http://<YOUR_IP>:5001`.

Curl example (tiny base64 payload):

```bash
# Sample minimal 1x1 PNG base64 (will be stretched by the server's preprocess)
IMG_B64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAgMBgY4t0VQAAAAASUVORK5CYII="
curl -s -X POST http://127.0.0.1:5001/predict \
  -H 'Content-Type: application/json' \
  -d "{\"grain_type\": \"auto\", \"image_base64\": \"$IMG_B64\"}"
```

Expected (example) response when model missing:

```
{
  "predicted_class": "toor",
  "confidence": 0.85,
  "probabilities": { ... },
  "attributes": { ... }
}
```

Python test snippet:

```python
import requests, base64

IMG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAgMBgY4t0VQAAAAASUVORK5CYII="
resp = requests.post('http://127.0.0.1:5001/predict', json={'grain_type': 'auto', 'image_base64': IMG_B64})
print(resp.json())
```

Notes:
- The server will not crash if `model/model.pt` is missing. It will use simulated responses.
- If you add a real PyTorch model, the server attempts to call it and handles both single-logit (binary) or multi-class outputs.
