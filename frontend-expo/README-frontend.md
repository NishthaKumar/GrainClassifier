# GrainClassifier Frontend (Expo)

This is a simple Expo app that lets you pick or take a photo, choose a grain type, and send the base64 image + grain type to the Flask backend.

Setup

1. Install dependencies:

```bash
cd frontend-expo
npm install
# Optionally use the expo installer for matched versions:
npx expo install
```

2. Start Expo (tunnel or LAN):

```bash
npx expo start --tunnel -c
```

3. Open the project in Expo Go on your phone. If you use LAN, update `SERVER_URL` in `frontend-expo/.env` to `http://<YOUR_MACHINE_IP>:5001`.

Environment file
----------------
This repo supports a simple `.env` at `frontend-expo/.env`. `app.config.js` reads that file and injects `SERVER_URL` into Expo's runtime config. Edit `frontend-expo/.env` to point to your backend (for example `SERVER_URL=http://192.168.1.10:5001`).

If you see the old value after changing `.env`, restart the Expo server (stop and run `npx expo start` again) so the new config is picked up.

Notes

- `App.js` contains the `SERVER_URL` constant near the top. Replace `127.0.0.1` with your machine IP when testing on a physical device.
- The app uses `expo-image-picker` and `@react-native-picker/picker`.
