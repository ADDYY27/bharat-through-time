# Bharat Through Time — An Atlas of the Subcontinent

> An interactive historical atlas and knowledge graph exploring the political, military, and territorial transformation of 18th-century India (1700–1820 CE).

---

## Architecture & Technology Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS v4, React-Leaflet & Leaflet, Fraunces serif & Inter typography.
- **Backend**: Node.js, Express 5, Mongoose, CORS.
- **Database**: MongoDB Atlas.
- **Hosting Architecture**:
  - **Frontend**: Vercel (Single-Page Application with rewrites and security headers).
  - **Backend**: Render Web Service (Node.js runtime with health monitoring and graceful shutdown).
  - **Database**: MongoDB Atlas (Cloud database).

---

## Core Application Modes

### 1. Historical Map
- **Chronological Slider**: Navigate year-by-year from 1700 CE to 1820 CE with era milestone quick-jumps (Late Mughal, Maratha Rise, Carnatic Wars, Mysore, Bengal, Sikh Empire).
- **Layer Controls**: Independent toggles for Political Territories, Cities & Capitals, and Battle Engagements.
- **Boundary Confidence**: Clear visual distinction between definite territorial control and approximate/weak presence.
- **Contextual Sidebar**: Dynamic overview showing active powers, key rulers, nearby events, and entity details with back-stack history.

### 2. Story Mode
- **Curated Narrative Chapters**: Walk through watershed moments of the 18th century (e.g. 1707 Aurangzeb's death, 1728 Palkhed, 1739 Sack of Delhi, 1780 Pollilur, 1799 Srirangapatna, 1805 Sikh unification).
- **Causal Chains**: Detailed antecedent causes and strategic consequences for each historical turning point.
- **Who Held Power Timeline**: Multi-track comparative lifespan timeline for the major powers, featuring clear indicators for powers continuing before 1700 (Mughals, Mysore, Marathas) and after 1820 (Nizam, Sikhs, Mysore).
- **Autoplay & Speed**: Playback controls with 0.5x, 1x, and 2x speeds, synchronized with map boundary updates.
- **Story-to-Compare Navigation**: One-click transition into Compare View between defining historical milestones.

### 3. Explore Mode
- **Comprehensive Historical Catalog**: Search across 177 real catalogued entities (polities, rulers, places, and events).
- **Multi-Field Search & Shortcuts**: Fast search across names, titles, dynasties, modern states, descriptions, and outcomes (press `/` to focus).
- **Thematic Discovery Collections**: Curated shelves highlighting major powers, decisive conflicts, historic capitals, and visionary figures.
- **Rich Entity Profiles**: Comprehensive profile drawer/dialog with portraits, era badges, metadata grid, historical narrative, and source citations.
- **Connected Graph Exploration**: Interactive navigation between related rulers, governing polities, capitals, and battle sites with breadcrumb history stack.
- **Explore on Map**: Direct jump from any entity profile to the Historical Map with automatic coordinates normalization and camera fly-to.

### 4. Compare View
- **Dual-Year Comparison**: Independent maps and year sliders for side-by-side analysis of territorial and political shifts across the subcontinent.
- **Responsive Layout**: Desktop side-by-side split screen and mobile-optimized panel switcher (`Split`, `Year A`, `Year B`).

---

## Production Deployment Guide

### Frontend Deployment (Vercel)
1. **Repository**: Connect this GitHub repository to Vercel.
2. **Root Directory**: Set to `frontend`.
3. **Framework Preset**: Vite.
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Environment Variable**:
   - `VITE_API_URL`: Your Render backend API endpoint (e.g. `https://bharat-through-time-api.onrender.com/api`).
7. **Routing**: `frontend/vercel.json` automatically manages client-side SPA routing rewrites.

### Backend Deployment (Render)
1. **Service Type**: Web Service.
2. **Root Directory**: `backend`.
3. **Runtime**: Node.
4. **Build Command**: `npm install`
5. **Start Command**: `node src/index.js`
6. **Health Check Path**: `/health` (or `/api/health`).
7. **Environment Variables**:
   - `PORT`: Set automatically by Render (defaults to `5000` locally).
   - `MONGODB_URI`: Your MongoDB Atlas connection string (`mongodb+srv://<user>:<password>@cluster.mongodb.net/bharat_through_time`).
   - `CORS_ORIGIN` *(optional)*: Your Vercel frontend domain (e.g. `https://bharat-through-time.vercel.app`), or leave unset to allow default access.

---

## Local Development Setup

### 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance (local or MongoDB Atlas connection string)

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MONGODB_URI
npm run dev
```
The backend server will run on `http://localhost:5000`. Test health with:
```bash
curl http://localhost:5000/health
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend application will start on `http://localhost:5173`.

### 4. Testing & Production Build
```bash
cd frontend
npm run lint    # Runs oxlint
npm run build   # Generates production bundle in dist/
```
