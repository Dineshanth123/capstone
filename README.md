# capstone

# Disaster Response Intelligence Dashboard

An AI-assisted disaster response system that ingests social media text, uploaded text, and images, then uses NLP, OCR, and geospatial analysis to help responders quickly locate and prioritize emergencies.

The project consists of:

- **Backend**: Node.js/Express API with MongoDB for persistent storage, Gemini for NLP, Tesseract.js for OCR, OpenStreetMap-based geocoding, email notifications, and Twitter ingestion.
- **Frontend**: React dashboard with maps, charts, and management views for text and image posts.

---

## Features

- Ingest free-form text posts (manual entry or Twitter fetch).
- Ingest image posts and extract text via OCR (Tesseract.js).
- Classify messages using Google Gemini (via `@google/generative-ai`):
  - Detect whether it is a help request.
  - Estimate urgency level (High / Medium / Low / Needs Review).
  - Identify help type (Medical, Food, Shelter, Rescue, Other).
- Extract structured details:
  - Names, contact info, locations, timestamps.
- Geocode locations using OpenStreetMap (via `node-geocoder`).
- Visualize incidents on an interactive heatmap and location statistics.
- Detect hotspots (clusters of high-urgency incidents within a radius).
- Trigger critical alerts:
  - Email alerts via Gmail/NodeMailer.
  

---

## Tech Stack

**Backend**

- Node.js, Express 5
- MongoDB + Mongoose
- Google Gemini (`@google/generative-ai`)
- Tesseract.js for OCR
- Node-Geocoder with OpenStreetMap
- Nodemailer (Gmail)
- Twitter API v2 (via `axios`)

**Frontend**

- React 18 + React Router
- Material UI (MUI)
- Leaflet + React-Leaflet
- Chart.js + react-chartjs-2

---

## Project Structure

- `backend/` – Express API and services
  - `src/app.js` – Express app and route registration
  - `src/server.js` – Server bootstrap and DB connection
  - `src/config/db.js` – MongoDB connection
  - `src/controllers/` – Controllers for text posts, image posts, and heatmap
  - `src/models/` – Mongoose models
  - `src/routes/` – Route definitions
  - `src/services/` – NLP, OCR, geocoding, notifications
  - `uploads/` – Stored image payloads (by ID)
- `frontend/` – React dashboard
  - `src/pages/` – Dashboard, HeatMap, ImagePosts, TextPosts, TwitterFetch
  - `src/services/api.js` – Axios client for backend API
- `EXECUTION_SETUP.md` – Windows-focused run instructions

---

## Prerequisites

- Node.js (LTS) with npm
- MongoDB (local instance or Atlas cluster)
- For full functionality:
  - Google Gemini API key
  - Twitter API bearer token
  - Gmail account for sending alerts

---

## Backend Setup

From the `backend` folder:

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
MONGO_URI=<your MongoDB connection string>
PORT=5000

# Gemini
GEMINI_API_KEY=<your_gemini_api_key>

# Email (Nodemailer via Gmail)
EMAIL_USER=<your_gmail_address>
EMAIL_PASSWORD=<your_gmail_app_password>
ALERT_EMAIL_RECIPIENTS=<comma_separated_emails_optional>


# Twitter API
TWITTER_BEARER_TOKEN=<your_twitter_bearer_token>
```

Start the backend:

```bash
# Development (with nodemon)
npm run dev

# or regular start
npm start
```

By default the API runs at `http://localhost:5000`.

More detailed run steps are documented in `EXECUTION_SETUP.md`.

---

## Frontend Setup

From the `frontend` folder:

```bash
cd frontend
npm install
npm start
```

- The React dev server runs on `http://localhost:3000`.
- The frontend is configured to talk to the backend at `http://localhost:5000` (see `src/services/api.js`).

---

## Key API Endpoints

All endpoints are prefixed with `/api`.

### Text posts (`/api/text-posts`)

- `GET /api/text-posts` – List all text posts.
- `POST /api/text-posts` – Create a new text post.
- `POST /api/text-posts/process/:id` – Run NLP on a single post and trigger alerts if needed.
- `POST /api/text-posts/process-all` – Process all pending text posts.
- `GET /api/text-posts/urgent` – List high-urgency posts.
- `GET /api/text-posts/stats` – Aggregate counts (total, urgent, etc.).
- `GET /api/text-posts/twitter/fetch?query=<q>&limit=<n>` – Import recent tweets matching a query.
- `DELETE /api/text-posts` – Delete all text posts.
- `GET /api/text-posts/test-notifications` – Check email configuration.

### Image posts (`/api/image-posts`)

- `GET /api/image-posts` – List image posts (metadata only).
- `POST /api/image-posts/upload` – Upload an image (`multipart/form-data`, field name `image`).
- `POST /api/image-posts/process/:id` – Run OCR + NLP and trigger alerts if needed.
- `POST /api/image-posts/process-all` – Process all pending image posts.
- `DELETE /api/image-posts/delete-all` – Delete all image posts.

### Heatmap and analytics (`/api/heatmap`)

- `GET /api/heatmap/data` – Heatmap points for map visualization.
  - Query params: `urgency`, `helpType`, `timeRange` (hours).
- `GET /api/heatmap/locations` – Aggregated stats by location (counts by urgency, coordinates).
- `GET /api/heatmap/hotspots?radius=<km>` – Clustered hotspots of high-urgency incidents.

### Root status

- `GET /` – Basic health/status check for the backend.

---

## Typical Development Workflow

1. Start MongoDB (local or ensure Atlas is reachable).
2. In one terminal:
   ```bash
   cd backend
   npm run dev
   ```
3. In another terminal:
   ```bash
   cd frontend
   npm start
   ```
4. Open the dashboard at `http://localhost:3000` and use the pages for:
   - Managing text posts and running classification.
   - Uploading and processing images.
   - Viewing the heatmap, hotspots, and location statistics.
   - Fetching posts from Twitter.

---


