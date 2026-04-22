# Setup Guide — AI Interior Designer

This guide covers everything you need to get the app working from scratch.

---

## Overview

The app has three parts:

| Part | What it does | Always on? |
|------|-------------|-----------|
| **Vercel frontend** | The website users visit | Yes — always live |
| **Firebase** | Login, profile, auto-connect | Yes — always live |
| **Google Colab** | Runs the AI (GPU required) | No — you start it manually |

**The Colab notebook must be running for AI generation to work.**
When Colab starts, it automatically tells the frontend its address — users don't need to enter anything manually.

---

## Part 1 — One-Time Firebase Setup

You only do this once.

### 1.1 Add your Vercel domain to Firebase Auth

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `ai-interior-designer-b4c9d`
3. Click **Authentication** in the left menu
4. Click the **Settings** tab
5. Scroll to **Authorized domains**
6. Click **Add domain**
7. Enter your Vercel URL: `ai-interior-designer-v2-m4z5.vercel.app`
8. Click **Add**

Without this step, Google login will fail on the live app.

### 1.2 Set Firestore security rules

1. In Firebase Console, click **Firestore Database**
2. Click the **Rules** tab
3. Replace the rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /config/{docId} {
      allow read: if true;
      allow write: if request.resource.data.secret == "interiorai-colab-2024";
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. Click **Publish**

This lets the Colab notebook write its URL to Firestore (with a secret key) while keeping user data private.

---

## Part 2 — One-Time Vercel Setup

You only do this once.

1. Go to [vercel.com](https://vercel.com) → your project
2. Click **Settings** → **Environment Variables**
3. Check that this variable exists:
   - **Name:** `REACT_APP_API_URL`
   - **Value:** `http://localhost:5000`
   (This is just a fallback — Colab's URL is set automatically via Firebase)
4. If you redeploy, make sure this variable is set

---

## Part 3 — Every Time You Want to Use AI

Each Google Colab session is temporary. When you want to use the AI features, follow these steps.

### Step 1 — Open the Colab notebook

Open this link (save it to your bookmarks):
`https://colab.research.google.com/drive/1Pm3BoUa0eih3Jq_tRHAXc2qiiGg1o7ho`

### Step 2 — Make sure you have a GPU

1. Click **Runtime** in the top menu
2. Click **Change runtime type**
3. Set **Hardware accelerator** to **T4 GPU**
4. Click **Save**

You only need to do this once per new session.

### Step 3 — Run all cells

Click **Runtime** → **Run all** (or press `Ctrl + F9`)

Then wait. This is what happens automatically:

| What happens | Time |
|-------------|------|
| Install packages | ~2 minutes |
| Mount Google Drive | ~30 seconds |
| Load ControlNet model | ~1 minute |
| Load Stable Diffusion | ~1 minute |
| Load Inpainting model | ~1 minute |
| Load YOLOv8 + SAM | ~1 minute |
| Start Flask server + ngrok | ~30 seconds |
| Register URL with Firebase | ~5 seconds |

Total: about **7–10 minutes** on first run. After the first time, models are cached in Google Drive so it takes **~3–4 minutes**.

### Step 4 — Check that it connected

Look at the last cell output in Colab. You should see something like:

```
Flask running on port 7860
ngrok tunnel: https://xxxx-xxxx.ngrok-free.app
Firebase URL registered successfully
```

On the Vercel app, the status dot (top right) should turn **green** within a few seconds.

### Step 5 — Keep Colab open

As long as the Colab tab is open and running, the app works for everyone.

If you close the Colab tab or it times out, AI generation will stop working. The website will still be accessible, but users will see "AI Offline."

---

## Part 4 — Using the App

### For the app owner (you)

1. Start Colab (Part 3 above)
2. Share the Vercel link with anyone: `https://ai-interior-designer-v2-m4z5.vercel.app`
3. Users can now generate images

### For users visiting the app

1. Go to the Vercel URL
2. Create an account or log in with Google
3. Upload a photo of a room (any angle, any lighting)
4. Pick a design style
5. Click **Generate Full Quality**
6. Wait 1–2 minutes for the result
7. Compare original vs. generated with the slider
8. Optionally: edit a specific object, compare styles, or download

---

## Troubleshooting

### The status dot is red ("Offline")

The Colab notebook is not running. Start it following Part 3.

### The status dot is yellow ("Partial")

The backend server is reachable but Colab is not connected. This can happen if:
- Colab timed out — re-run all cells
- The Firebase cell didn't run — scroll to the last cells in Colab and run the Firebase cell manually

### Generation fails with "Colab may be busy or models still loading"

The models are still loading. Wait until all Colab cells finish running (the circle icons on the left of each cell should be checkmarks, not spinning).

### Google login gives "auth/unauthorized-domain"

Your Vercel domain is not in Firebase Auth authorized domains. Follow Step 1.1 in Part 1.

### Colab disconnects during the session

This happens after ~90 minutes of inactivity on the free plan, or after 12 hours total.

Fix: Go back to Colab → Runtime → Run all. Wait 3–4 minutes (models load from Drive cache). The app reconnects automatically.

### Upload fails / CORS error

This usually means the Colab cell didn't register the URL correctly. Re-run all Colab cells.

### Preview All 8 Styles is stuck at 0%

Make sure all model cells ran successfully. The preview endpoint requires all 4 models to be loaded (Stable Diffusion, ControlNet, Inpainting, YOLOv8).

### Object editing has no detected objects

YOLOv8 needs to find furniture in the generated image. Try generating with a style that includes furniture (not Minimalist, which may show empty rooms). Also, the confidence threshold is 15% — low-confidence objects won't show.

---

## Running Locally (for development)

If you want to test code changes on your own computer:

**Terminal 1 — Start Flask:**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

**Terminal 2 — Start React:**
```bash
cd frontend
npm install
npm start
```

The React app opens at `http://localhost:3000`.
For AI to work locally, you still need Colab running — the local Flask routes requests to Colab.

---

## File Reference

| File | Purpose |
|------|---------|
| `backend/AI_Interior_Designer_v2.ipynb` | Main Colab notebook — run this for AI |
| `backend/app.py` | Local Flask API (optional) |
| `frontend/src/config.js` | API URL management |
| `frontend/src/firebase.js` | Firebase project config |
| `frontend/src/App.js` | Main app logic + Firebase auto-connect |
| `frontend/src/components/BackendSetup.js` | Manual URL connection popup |

---

## Cost

Everything used in this project is **free**:

| Service | Cost | Limit |
|---------|------|-------|
| Vercel (frontend) | Free | Unlimited for personal projects |
| Firebase (auth + Firestore) | Free | 50K reads/day, 20K writes/day |
| Google Colab | Free | T4 GPU, 12 hrs/session |
| ngrok | Free | 1 tunnel, URL changes per session |

For heavier usage (many users, many generations), consider Colab Pro ($10/month) for longer sessions and faster GPUs.
