
# GrainClassifier

GrainClassifier is a mobile (Expo React Native) application with a Flask backend that uses an Ultralytics YOLOv8 classification model to identify grain types (for example, `type_1`, `type_2`, `toor`, etc.) from an image and return the prediction confidence.

---

## Repository Structure

- `backend-flask/` — Flask API and model loading code  
- `frontend-expo/` — Expo React Native frontend  
- `backend-flask/model/` — Directory for trained YOLO weights (`model.pt`, not tracked in VCS)

---

## Backend (Flask + Ultralytics)

### Prerequisites

- Python 3.10 or 3.11  
- `pip`

---

### Setup

From `backend-flask`:

```bash
python3.11 -m venv venv     # or python3.10
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install --upgrade pip
pip install ultralytics flask flask-cors pillow
```

If you maintain a `requirements.txt`, you can instead run:

```bash
pip install -r requirements.txt
```

Copy your trained YOLOv8 classification weights to:

```bash
backend-flask/model/model.pt
```

---

### Running the Backend

With the virtual environment active:

```bash
python server.py
```

The service exposes:

- **GET** `/health` — Basic status and `model_loaded` flag  
- **POST** `/predict` — Accepts JSON with:

```json
{
  "grain_type": "toor",
  "image_base64": "<base64-encoded image data>"
}
```

Response example:

```json
{
  "predicted_class": "type_2",
  "confidence": 0.98
}
```

---

## Frontend (Expo React Native)

### Prerequisites

- Node.js and npm or yarn  
- Expo CLI (via `npx expo`)

---

### Setup & Run

From `frontend-expo`:

```bash
npm install        # or: yarn
npx expo start
```

---

### Frontend Functionality

The frontend:

- Allows the user to select a grain type from a picker  
- Captures or selects an image and encodes it as base64  
- Sends a **POST** request to the backend `/predict` endpoint with `grain_type` and `image_base64`  
- Displays `predicted_class` and `confidence` returned by the backend  

Configure `SERVER_URL` in the frontend to point to your backend instance, for example:

```js
const SERVER_URL = 'http://192.168.29.46:5001';
```

For a physical device, this must be the machine's LAN IP, not `127.0.0.1`.

---

## Networking Notes

- Backend default bind: `0.0.0.0:5001`  
- Devices running the Expo app must be on the same network as the backend host  
- You can verify connectivity via:

```
http://<your-ip>:5001/health
```

---

## Version Control

Recommended ignore rules:

- `backend-flask/venv/`  
- `backend-flask/model/*.pt`  
- `frontend-expo/node_modules/`  
- Any local environment files (for example `.env`, `.env.local`)
