# 🛡️ Guardian AI: Silent Model Drift Detection System

> **"AI models don't crash; they slowly drift into irrelevance."**

Welcome to **Guardian AI**, a high-precision early warning system designed to detect **Silent Model Drift** before it impacts your business KPIs.

---

## ⚡ The Pain Point: "Silent Failure"
AI models degrade silently when the real-world data distribution shifts (e.g., economy changes, user behavior evolves). Traditional monitoring only alerts you when KPIs drop—by then, you've already lost money. 

**Guardian AI** watches the **data flow**, not just the output.

## 🚀 Key Features
- **Real-Time Distribution Comparison**: Uses the **Kolmogorov-Smirnov (KS)** test to detect statistical significance in feature shifts.
- **Drift Score Dashboard**: A premium, glassmorphism-inspired UI for visual monitoring.
- **Synthetic "Market Shift" Simulation**: Built-in recession scenario to test your model's robustness.
- **Performance Impact Simulation**: Real-time visualization of how data drift correlates with accuracy and F1-score decay.
- **Sidecar Architecture**: Plugs into any ML pipeline without modifying core logic.

## 🛠️ Tech Stack
- **Frontend**: Vanilla JS + Vite (Optimized for speed and minimal footprint)
- **Styling**: Premium CSS (Glassmorphism, CSS Variables, Modern Fluid Layouts)
- **Visualization**: Chart.js 4.x
- **Statistics Engine**: Optimized JS implementation of the KS-test.

## 📦 Getting Started
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Click **"Trigger Market Shift"** on the dashboard to see the drift detector in action.

---

### Author
Designed with ❤️ by **Antigravity** for the **50 Day AI Challenge**.
"Building the immune system for your AI."
