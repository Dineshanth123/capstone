# Project Execution Setup Guide (Windows)

This guide explains how to install dependencies and run both the backend and frontend for this project on Windows.

---

## 1. Prerequisites

- **Node.js (LTS)** installed from https://nodejs.org (includes `npm`).
- **MongoDB** running locally or available via a cloud service (e.g., MongoDB Atlas).
- A terminal such as **PowerShell** (recommended on Windows).

---

## 2. Backend Setup (Express + MongoDB)

**Path:** `d:\capstone\backend`

1. Open a terminal and navigate to the backend folder:

   ```bash
   cd d:\capstone\backend
   ```

2. Install backend dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in `d:\capstone\backend` (if it does not exist) and add at least:

   ```env
   MONGO_URI=<your MongoDB connection string>
   PORT=5000
   # EMAIL_USER=...
   # EMAIL_PASS=...
   # GEMINI_API_KEY=...
   ```

4. Start the backend server:
   - Development mode with auto-restart (requires `nodemon` – already in devDependencies):
     ```bash
     npm run dev
     ```
   - Or normal start:
     ```bash
     npm start
     ```

5. The backend should now be running (by default) at:
   - `http://localhost:5000`

Confirm this by opening a browser or using a tool like `curl` or Postman against one of your API routes.

---

## 3. Frontend Setup (React App)

**Path:** `d:\capstone\frontend`

1. Open a **second** terminal window and navigate to the frontend folder:

   ```bash
   cd d:\capstone\frontend
   ```

2. Install frontend dependencies:

   ```bash
   npm install
   ```

3. Start the React development server:

   ```bash
   npm start
   ```

4. The frontend will start at:
   - `http://localhost:3000`

The frontend `proxy` in `frontend/package.json` is set to `http://localhost:5000`, so any calls like `/api/...` from the React app will be forwarded to the backend during development.

---

## 4. Typical Run Workflow

Every time you want to run the project locally:

1. **Start MongoDB**
   - If MongoDB is local, make sure the MongoDB service is running.

2. **Start backend (Terminal 1)**

   ```bash
   cd d:\capstone\backend
   npm run dev
   ```

3. **Start frontend (Terminal 2)**

   ```bash
   cd d:\capstone\frontend
   npm start
   ```

4. Open your browser at:
   - `http://localhost:3000`

The React app should now be able to communicate with the backend API and display data accordingly.

---

## 5. Troubleshooting Tips

- If the frontend cannot reach the backend, check that:
  - The backend is running without errors.
  - The backend `PORT` matches the `proxy` URL in `frontend/package.json` (`http://localhost:5000`).

- If MongoDB connection fails:
  - Verify `MONGO_URI` is correct in `.env`.
  - Confirm MongoDB is running and reachable.

- After changing backend code while running `npm start` (not `npm run dev`):
  - You must manually stop and restart the server.

You can edit this file (EXECUTION_SETUP.md) to add any project-specific notes or environment variables as your app evolves.
