# GrainClassifier

Full-stack example app: a Flask backend that (optionally) serves a PyTorch model and an Expo React Native frontend that sends photos to the backend.

Implemented:

- Backend: `backend-flask/server.py` and helpers. Supports safe dummy responses if `model/model.pt` is not present. Health and predict endpoints.
- Frontend: `frontend-expo/App.js` — Expo Go compatible UI that picks/takes photos and sends base64 image + chosen grain type to backend.

Notes:

- The included model is not provided. The app assumes a `toor` model; other grain classes are placeholders.
- For development you can run the backend without a model; the server returns simulated predictions so the frontend can be developed/tested.

# GrainClassifier
