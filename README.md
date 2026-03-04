# 🛡️ Guardian AI: Silent Model Drift Detection System

> **"AI models don't crash; they slowly drift into irrelevance."**

Welcome to **Guardian AI**, a high-precision early warning system designed to detect **Silent Model Drift** before it impacts your business KPIs. This project was built with a dual mindset: **Researcher-Grade Correctness** and **Entrepreneurial Scalability**.

---

## ⚡ The Pain Point: "Silent Failure"
AI models degrade silently when the real-world data distribution shifts (e.g., economy changes, user behavior evolves). Traditional monitoring only alerts you when KPIs drop—by then, you've already lost money. 

**Guardian AI** watches the **data flow**, not just the output.

## 🚀 Key Features
- **Real-Time Distribution Comparison**: Uses the **Kolmogorov-Smirnov (KS)** test to detect statistical significance in feature shifts.
- **Drift Score Dashboard**: A premium, glassmorphism-inspired UI for visual monitoring.
- **Synthetic "Market Shift" Simulation**: Built-in recession scenario to test your model's robustness.
- **Sidecar Architecture**: Plugs into any ML pipeline without modifying core logic.

## 🔬 Researcher's Mindset (Correctness & Rigor)
- **Algorithm**: Non-parametric two-sample Kolmogorov-Smirnov test.
- **Thresholds**: Statistical significance at $p < 0.05$ with critical value calculation.
- **Assumption**: IID (Independent and Identically Distributed) baseline samples.
- **Validation**: KS-statistic ($D_{max}$) is used as the normalized "Drift Score".

## 💼 Entrepreneur's Mindset (Economics & Strategy)
- **Problem-Solution Fit**: Directly addresses "Model ROI Preservation."
- **Low Friction**: Minimal dependencies; no heavy ML-Ops infra required for the monitor itself.
- **Extensible**: Ready for adaptation into any high-stakes AI sector (Fintech, Health, AdTech).
- **USP**: Detecting **Data Drift** (Input) vs. **Concept Drift** (Relationship) vs. **Performance Decay** (Output).

---

## 🛠️ Tech Stack
- **Frontend**: Vanilla JS + Vite (Optimized for speed and minimal footprint)
- **Styling**: Premium CSS (Glassmorphism, CSS Variables, Modern Fluid Layouts)
- **Visualization**: Chart.js 4.x
- **Statistics engine**: Ported from Python/SciPy to efficient JavaScript.

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

## 📖 Case Study: The "Bull Market" Fallacy
Imagine a credit scoring model trained during an economic boom. When a recession hits:
1.  **Incoming Income** data drops (The shifted feature).
2.  The model, unaware of the shift, grants high-risk loans (The silent failure).
3.  **Guardian AI** detects the **Income distribution shift** on day 1, triggering a retrain *before* the first default event.

---

### Author
Designed with ❤️ by **Antigravity** for the **50 Day AI Challenge**.
"Building the immune system for your AI."
