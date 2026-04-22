# AI Interior Designer v2

Transform any room photo into a professionally designed space using AI — in minutes.

**Live App:** [ai-interior-designer-v2-m4z5.vercel.app](https://ai-interior-designer-v2-m4z5.vercel.app)

---

## What It Does

Upload a photo of your room. Pick a design style. The AI redesigns it while keeping your walls, windows, and layout exactly the same — only the style changes.

You can also:
- Edit individual objects ("replace the sofa with a white leather couch")
- Preview all 8 styles at once before committing
- Compare two styles side by side
- Apply a color palette to guide the mood
- Describe a completely custom style in your own words
- Download the result with a watermark

---

## 8 Built-in Design Styles

| Style | Vibe |
|-------|------|
| Minimalist | Clean, white space, serene |
| Industrial | Raw concrete, metal, exposed brick |
| Cyberpunk | Neon lights, RGB, sci-fi |
| Modern Luxury | Marble, gold, velvet |
| Scandinavian | Natural wood, hygge warmth |
| Mid-Century | Retro 1960s, teak, geometric |
| Japanese Zen | Wabi-sabi, bamboo, calm |
| Bohemian | Colorful textiles, eclectic |

---

## How It Works

```
Your photo → Edge detection → Stable Diffusion + ControlNet → Styled room
```

The app uses **ControlNet (Canny)** — this means it traces the edges of your walls, doors, and windows first, then applies the style *within* that structure. Your room's layout stays the same; only the look changes.

For object editing, it uses **YOLOv8** to detect furniture, **SAM** to create precise masks, and **Stable Diffusion Inpainting** to replace individual objects.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Framer Motion, Firebase |
| AI Models | Stable Diffusion 1.5, ControlNet Canny, YOLOv8, SAM |
| GPU | Google Colab (free tier works) |
| Auth | Firebase Auth (Email + Google) |
| Auto-connect | Firebase Firestore (Colab registers its URL automatically) |
| Hosting | Vercel (frontend) |

---

## Quick Setup

**For users:** See [SETUP_GUIDE.md](SETUP_GUIDE.md) — a complete step-by-step guide to get the app running.

**For developers:**

```bash
# Frontend
cd frontend
npm install
npm start

# Backend (local Flask)
cd backend
pip install -r requirements.txt
python app.py
```

The main AI pipeline runs on Google Colab (free GPU). See the setup guide for how to connect it.

---

## Project Structure

```
ai-interior-designer-v2/
├── frontend/               # React app (deployed on Vercel)
│   └── src/
│       ├── App.js          # Main app + routing
│       ├── config.js       # API URL helper
│       ├── firebase.js     # Firebase config
│       └── components/
│           ├── Auth.js           # Login / Register
│           ├── Upload.js         # Image upload
│           ├── StyleSelector.js  # Style + color + custom prompt
│           ├── ResultView.js     # Compare slider + download
│           ├── ObjectEditor.js   # Edit individual objects
│           ├── StyleComparison.js # Side-by-side comparison
│           ├── FurnishRoom.js    # Furniture-based generation
│           ├── BackendSetup.js   # Connect backend popup
│           └── Toast.js          # Notifications
│
├── backend/
│   ├── AI_Interior_Designer_v2.ipynb  # Main Colab notebook (run this)
│   ├── app.py                          # Flask API (optional local server)
│   └── requirements.txt
│
└── SETUP_GUIDE.md          # How to use the app
```

---

## Notes

- AI generation takes **1–2 minutes** per image (Colab T4 GPU)
- Previewing all 8 styles at once takes **~8 minutes**
- Models load from Google Drive — fast after the first session
- The Colab session must stay open for AI to work; the Vercel frontend stays live always
