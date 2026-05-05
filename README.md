# Handover — Nursing Shift Handover Tool

A web application for nurses to record patient information during a shift and generate a clean handover report for the next shift.

## What it does

- Track multiple patients on the ward
- Record vital signs (BP, HR, Temp, SpO2, RR) and view a chart of how they changed across the shift
- Log medications and mark them as given, missed, or withheld
- Track tests and investigations (bloods, imaging, ECG) and their results
- Add shift notes and to-do items
- Print a complete handover sheet for the incoming shift nurse

---

## Prerequisites

Before running this app, you need **Node.js** installed.
- Download from https://nodejs.org (choose the LTS version)
- After installing, verify it works: open Command Prompt and type `node --version`

---

## How to install

You only need to do this once.

**Step 1 — Install the server dependencies:**
Open a terminal in the `handover/server` folder and run:
```
npm install
```

**Step 2 — Install the client dependencies:**
Open a terminal in the `handover/client` folder and run:
```
npm install
```

---

## How to run

You need **two terminal windows open at the same time**.

**Terminal 1 — Start the backend server:**
```
cd handover\server
node index.js
```
You should see: `Handover server running at http://localhost:3001`

**Terminal 2 — Start the frontend:**
```
cd handover\client
npm run dev
```
You should see: `Local: http://localhost:5173`

**Then open your browser and go to:** http://localhost:5173

---

## Folder overview

```
handover/
├── README.md              ← This file
├── server/                ← The backend (Node.js + Express)
│   ├── index.js           ← Server entry point
│   ├── db.js              ← Database setup and sample data
│   ├── handover.db        ← SQLite database file (created automatically)
│   └── routes/            ← API route handlers
│       ├── patients.js
│       ├── vitals.js
│       ├── medications.js
│       ├── investigations.js
│       └── notes.js
└── client/                ← The frontend (React)
    └── src/
        ├── api/           ← Functions that talk to the server
        ├── components/    ← Reusable UI pieces
        └── pages/         ← Full page views
```

---

## How to print a handover report

1. Go to the **Ward Dashboard** (the home page)
2. Click **"Print Handover"** in the top right corner
3. Your browser's print dialog will open
4. The printed sheet will show all patients with their latest vitals, medications, investigations, notes, and to-dos

---

## Sample data

When you start the server for the first time, it automatically creates 2 sample patients with vitals, medications, investigations, and notes — so you can explore the app straight away without entering data manually.

---

## Stopping the app

Press `Ctrl + C` in each terminal window to stop the server and the frontend.
