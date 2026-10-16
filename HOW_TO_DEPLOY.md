# How to Deploy on Vercel

Yes — you can host the full app on Vercel.

## 1) Deploy the backend on Vercel

Use a Vercel project for the API, or use a serverless API route in the same repo.

### Required backend environment variables

```env
PORT=10000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/cti_verify
CLIENT_URL=https://your-frontend-project.vercel.app
CTI_SOURCE_URL=https://ctidigest.com/
```

> If you want to avoid Render's credit-card prompt, deploy the backend as a Vercel serverless API instead of a Render service.

### Backend deployment notes

- Keep the backend on a public Vercel URL.
- Do not put your MongoDB Atlas connection string in frontend code.
- Make sure CORS allows your frontend domain in `CLIENT_URL`.

## 2) Deploy the frontend on Vercel

### Set the frontend API URL

Before deploying the frontend, configure:

```env
VITE_API_URL=https://your-backend-project.vercel.app/api
```

### Vercel project setup

1. Import the repo into Vercel.
2. Set the root directory to:

```text
frontend
```

3. Add the environment variable:

```env
VITE_API_URL=https://your-backend-project.vercel.app/api
```

4. Deploy.

## 3) Final production configuration

Use these live values:

```env
# Backend
MONGODB_URI=mongodb+srv://...
CLIENT_URL=https://your-frontend-project.vercel.app
CTI_SOURCE_URL=https://ctidigest.com/

# Frontend
VITE_API_URL=https://your-backend-project.vercel.app/api
```

## 4) Verify the deployment

- Open the Vercel frontend site.
- Confirm the dashboard loads.
- Confirm the frontend can reach the backend API.
- Confirm MongoDB is connected from the backend.
- Confirm the app works without exposing secrets in the browser.

## 5) Clean final packaging

Before final submission, remove local build artifacts and environment files from the ZIP, while keeping:

- `package-lock.json`
- `.env.example`

Do not include:

- `.git/`
- `node_modules/`
- local `.env` files
- build caches

The repo includes a PowerShell packaging helper to do this:

```bash
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\prepare-final-zip.ps1
```

Before final submission, remove local build artifacts and environment files from the ZIP, while keeping:

- `package-lock.json`
- `.env.example`

Do not include:

- `.git/`
- `node_modules/`
- local `.env` files
- build caches

The repo includes a PowerShell packaging helper to do this:

```bash
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\prepare-final-zip.ps1
```
