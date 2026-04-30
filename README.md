# Prodigy Quality Monitoring

AI-Powered production problem detection and step optimization system built by the Prodigy team.

## Overview

This repository contains a full-stack solution for monitoring production issues, analyzing root causes, and suggesting optimal maintenance or repair steps. It combines:

- A React frontend dashboard for viewing problems and insights
- An Express backend API for storing, analyzing, and serving production problem data
- SQLite for local data persistence
- Excel import support for bulk problem ingestion
- Docker Compose configuration for easy deployment

## Key Features

- Upload Excel files to import problem records
- View problem list and full analysis results
- Fetch optimal repair steps and graded approach scores
- Track approach recommendations and AI-augmented analysis
- Local deployment with Docker or classic Node/npm setup

## Repository Structure

- `backend/` - Express API server, SQLite database, upload handling, analysis logic
- `frontend/` - React app for dashboard UI
- `deploy/` - NGINX configuration for reverse proxy
- `docker-compose.yml` - Multi-service startup for backend, frontend, and NGINX

## Backend

The backend is implemented with Node.js and Express. It uses:

- `sqlite3` for lightweight local storage
- `multer` / `express-fileupload` for file uploads
- `cors` to allow frontend access
- `dotenv` for environment configuration

### Backend responsibilities

- Initialize SQLite tables for problems, approaches, optimal steps, scores, and analysis
- Expose REST endpoints for problem retrieval and analysis
- Accept Excel uploads to populate data
- Serve health and root status endpoints

## Frontend

The frontend is a Create React App project that communicates with the backend API. It is configured to proxy requests to `http://localhost:5000` during development.

## Requirements

- Node.js (recommended v18+)
- npm
- Docker and Docker Compose (optional)

## Environment Variables

The repository ignores local environment files. Create `.env` or backend-specific env files as needed.

Backend variables:

- `PORT` – backend port (default `5000`)
- `AZURE_API_KEY` – optional Azure AI key
- `AZURE_ENDPOINT` – optional Azure endpoint URL

## Local Development

### Start backend

```bash
cd backend
npm install
npm run dev
```

### Start frontend

```bash
cd frontend
npm install
npm start
```

Then open the frontend at `http://localhost:3000`.

## Docker Compose

To run the full stack with Docker Compose:

```bash
docker compose up --build
```

The app is served through NGINX on port `5174`.

## API Endpoints

- `GET /` - root status
- `GET /api/health` - health check
- `GET /api/problems` - list all problems
- `GET /api/problems-with-full-analysis` - list problems with analysis data
- `GET /api/problems/:id` - get a single problem
- `GET /api/problems/:id/optimal-steps` - get recommended optimal steps
- `GET /api/problems/:id/approach-scores` - get approach scores and best approach
- `GET /api/problems/:id/approaches` - get all approaches for a problem
- `POST /api/upload-excel` - upload Excel file to ingest problem data

## Notes

- The backend automatically creates the `backend/uploads` folder if it is missing.
- The SQLite database file is stored at `backend/prodigy.db`.
- The dashboard UI depends on backend connectivity for problem and analysis data.

## Contribution

1. Create a feature branch
2. Commit changes with a clear message
3. Open a pull request targeting `main`

---

Enjoy working with Prodigy Quality Monitoring!
