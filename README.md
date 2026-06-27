# Quant Advisor Terminal 📈📊

An advanced, full-stack financial analysis terminal built to bridge the gap between complex quantitative data and clean, actionable visual insights. The platform fetches real-time stock data, calculates key technical metrics, and displays interactive charts to help users track and analyze the markets.

🔗 **Live Link:** [quant-advisor-terminal.onrender.com](https://quant-advisor-terminal.onrender.com/)

---

## 🚀 Features

- **Real-Time Market Tracking:** Fetches live asset summaries, dynamic price feeds, and core financial metadata.
- **Quantitative Analytics & Indicators:** Real-time processing of key technical indicators and financial data points.
- **Dynamic Data Visualization:** High-density, responsive charts and terminal-style components tailored for finance.
- **Robust API Integration:** Built using reliable external financial streams to deliver accurate, up-to-date Nifty 50 and global market statistics.

---

## 🛠️ Tech Stack

- **Frontend:** React, HTML5, CSS3 (Custom interactive UI/UX for fintech density)
- **Backend Architecture:** Dual-engine environment combining **Python** (for analytical and data-heavy computations) and **Node.js** (for efficient server-side routing and API logic)
- **Data Source:** Financial Modeling Prep (FMP) API

---

## 📁 Repository Structure

```text
├── frontend/             # React Application
│   ├── src/
│   │   ├── components/   # Charts, Terminal Widgets, Search bars
│   │   ├── App.js        # Main Dashboard Layout
│   │   └── index.css     # Styling and layout rules
│   └── package.json
│
└── backend/              # Dual Engine API Layer
    ├── node/             # Server routing and endpoint management
    └── python/           # Financial indicator calculations and analytics engines
