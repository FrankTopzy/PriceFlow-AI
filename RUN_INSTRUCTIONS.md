# PriceFlow AI — Running Locally

Follow these steps to run the complete system on your machine.

## Prerequisites
- **Python 3.13+**
- **Node.js 18+**

---

## 1. Start the Backend API
The backend handles all the Machine Learning logic and data processing.

1.  Open a terminal in the `/backend` folder.
2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
3.  **Run the server:**
    ```bash
    python -m uvicorn main:app --reload --port 8000
    ```
    *The API will be live at `http://127.0.0.1:8000`*

---

## 2. Start the Frontend Dashboard
The frontend provides the user interface for monitoring and simulation.

1.  Open a second terminal in the `/frontend` folder.
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment:**
    Ensure there is a file named `.env` in the `/frontend` folder with this content:
    ```env
    VITE_API_URL=http://127.0.0.1:8000
    ```
4.  **Run the app:**
    ```bash
    npm run dev
    ```
    *The dashboard will be live at `http://localhost:5173` (or the URL shown in your terminal).*

---

## Summary of URLS
- **Dashboard:** `http://localhost:5173`
- **API Status:** `http://127.0.0.1:8000/`
- **Interactive API Docs:** `http://127.0.0.1:8000/docs`
