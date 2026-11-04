# 🦋 The Moth in the Machine
> **An Interactive Computational Thinking & Debugging Game**  
> *Developed as an Internship Engineering Project*

---

## 🌟 Overview

**The Moth in the Machine** is an interactive, visual educational game designed to teach children and computer science students the core foundations of programming: **Sequencing**, **Conditionals**, **Loops**, and **Debugging**.

The game is named in honor of computing pioneer **Rear Admiral Grace Hopper**, who on **September 9, 1947**, discovered the world's first documented computer bug: an actual moth trapped inside Relay #70 of the Harvard Mark II electromechanical computer.

---

## ✨ Features

- **🎮 4 Interactive Challenge Levels**:
  1. **Level 1 (Rocket Waypoints)**: Sequential path navigation with Waypoints (1) → (2) → (3) → Golden Goal Star.
  2. **Level 2 (Lamp Circuit)**: Electrical state logic & Boolean conditions (`ON` vs `OFF`).
  3. **Level 3 (Fork in the Path)**: Conditional branching and directional navigation at a Y-junction.
  4. **Level 4 (Stamper Machine Loop)**: Loop counters and off-by-one bug resolution.
- **🔄 Authentic 3-Phase Debugging Methodology**:
  - **Phase 1: Find the Bug** — Observe buggy behavior and diagnose the root cause.
  - **Phase 2: Pick the Fix** — Select the corrective instruction to patch the code sequence.
  - **Phase 3: Watch it Work** — Watch the corrected sequence execute with full celebratory animations and audio!
- **🎨 Enhanced Visuals & Aesthetics**:
  - Fluid HTML5 Canvas 2D animations with physics-based squash-and-stretch.
  - Ambient radial glow lighting, tactile 3D skeuomorphic buttons, and animated speech alerts (*"Dark!"*, *"Empty!"*, *"Need 1 more!"*).
  - Built-in multi-colored **Confetti Explosion** upon mission completion.
- **🔊 Zero-Dependency Web Audio Synthesizer**:
  - Synthesizes all sounds in real-time using the **Web Audio API** (rocket thrusters, relay switch clicks, electric arcs, hydraulic stamp thuds, and victory fanfares).
- **⚡ Full-Stack Node.js Architecture**:
  - Lightweight, dependency-free Node.js HTTP server.
  - REST API endpoints for level delivery, answer verification, session tracking, and high scores.
  - Works both in full-stack mode or standalone offline file mode.
- **📜 Printable Certificate of Debugging Excellence**:
  - Generates an official, printable completion certificate with the intern's name, score, and date stamp.

---

## 📁 Project Structure

```
moth-in-the-machine/
├── server.js              # Native Node.js HTTP & REST API Server
├── package.json           # Project manifest & run scripts
├── .gitignore             # Standard repository ignore list
├── README.md              # Project documentation (this file)
├── EXPLANATION.md         # In-depth line-by-line engineering breakdown
├── push-to-github.bat     # One-click helper script to push to GitHub
├── data/
│   ├── levels.json        # Structured JSON dataset for all 4 game levels
│   └── leaderboard.json   # Persistent high-score records
└── public/
    ├── index.html         # Main game layout and semantic DOM structure
    ├── css/
    │   └── style.css      # Custom stylesheet (variables, glassmorphism, animations)
    └── js/
        ├── audio.js       # Real-time Web Audio API sound synthesizer
        ├── particles.js   # Canvas particle system & confetti engine
        ├── scenes.js      # Procedural canvas renderers for all 4 level scenes
        └── game.js        # Central game engine, state machine, & REST client
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) installed (v16.0.0 or higher recommended).

### Running the Full-Stack App
1. Open your terminal or PowerShell in this directory:
   ```bash
   cd moth-in-the-machine
   ```
2. Start the game server:
   ```bash
   npm start
   ```
   *(or run `node server.js` directly)*
3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Running Standalone (Without Server)
You can also directly double-click `public/index.html` in your file explorer to run the game in offline mode!

---

## 🛠️ API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/levels` | Retrieves all game levels, phases, options, and code snippets |
| `GET` | `/api/levels/:id` | Retrieves detailed configuration for a specific level |
| `POST` | `/api/validate` | Validates a player's selected option against expected solution |
| `GET` | `/api/progress` | Fetches active player's score, current level, and elapsed time |
| `POST` | `/api/progress/reset`| Resets the current game session |
| `GET` | `/api/leaderboard` | Fetches high scores and completion times |
| `POST` | `/api/leaderboard` | Submits a new score entry to persistent storage |
| `GET` | `/api/history` | Fetches historical facts about Grace Hopper and the 1947 bug |

---

## 🐙 Pushing to GitHub

1. If Git is installed on your computer, simply double-click `push-to-github.bat` or run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: The Moth in the Machine game"
   git branch -M main
   git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
   git push -u origin main
   ```
2. If you don't have Git installed yet:
   - Download Git from [git-scm.com](https://git-scm.com/download/win) or run `winget install Git.Git` in PowerShell.
   - Alternatively, open [GitHub.com](https://github.com), create a new repository, click **Upload files**, and drag the `moth-in-the-machine` folder contents directly into GitHub!

---

## 🎓 Internship Presentation Highlights

- **Pedagogical Design**: Direct visual alignment between concrete physical animations and abstract programming constructs (loops, conditionals, state machines).
- **Zero-Dependency Architecture**: Built using pure vanilla web standards (HTML5 Canvas, CSS3, Web Audio API, native Node.js HTTP).
- **Resilient Fallback**: Gracefully degrades to client-side evaluation if the backend server is disconnected or running locally.
