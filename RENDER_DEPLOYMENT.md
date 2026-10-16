# Vercel Deployment Guide

Yes — you can deploy this project fully on Vercel.

The simplest setup is:
- Frontend: Vercel project for the React app
- Backend: Vercel project or Vercel serverless API
- Database: MongoDB Atlas

## 1) Prepare the backend configuration

Set the backend environment variables to the Vercel frontend URL:

```env
PORT=10000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/cti_verify
CLIENT_URL=https://your-frontend-project.vercel.app
CTI_SOURCE_URL=https://ctidigest.com/
```

Notes:
- `CLIENT_URL` must match the actual Vercel frontend domain.
- Do not expose the MongoDB connection string in frontend code.
- If the backend is deployed as a separate Vercel project, use that backend domain instead.

## 2) Deploy the backend on Vercel

You can deploy the API as a Vercel Node project or serverless API.

For a separate backend project:

1. Import the repository to Vercel.
2. Set the root directory to:

```text
backend
```
3. Use the Node runtime.
4. Set build/start settings depending on your Vercel setup.
5. Add these environment variables in Vercel:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/cti_verify
CLIENT_URL=https://your-frontend-project.vercel.app
CTI_SOURCE_URL=https://ctidigest.com/
PORT=10000
```

## 3) Deploy the frontend on Vercel

Set the frontend environment to the deployed backend URL:

```env
VITE_API_URL=https://your-backend-project.vercel.app/api
```

Or if the backend is in the same Vercel project:

```env
VITE_API_URL=https://your-project.vercel.app/api
```

Then deploy the frontend project from the `frontend` folder.

## 4) Final production configuration

Use values like this for the live app:

```env
# Backend
MONGODB_URI=mongodb+srv://...
CLIENT_URL=https://your-frontend-project.vercel.app
CTI_SOURCE_URL=https://ctidigest.com/

# Frontend
VITE_API_URL=https://your-backend-project.vercel.app/api
```

## 5) Verify the deployment

Open the deployed backend and test:

```text
https://your-backend-project.vercel.app/api/health
```

You should get a JSON response like:

```json
{ "ok": true, "database": "cti_verify" }
```

Then open the frontend site and confirm it loads data from the deployed API.

## 6) Recommended setup

For this project, the cleanest arrangement is:
- Frontend: Vercel app
- Backend: separate Vercel app
- MongoDB: Atlas

This keeps the frontend static and the API reachable without exposing secrets.
