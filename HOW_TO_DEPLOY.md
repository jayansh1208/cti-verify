# How to Deploy on GitHub Pages + Hosted Backend

## 1) Deploy the backend

Use a hosted service such as Render or Railway.

### Required backend environment variables

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/cti_verify
CLIENT_URL=https://your-github-user.github.io
CTI_SOURCE_URL=https://ctidigest.com/
```

### Backend deployment notes

- Keep the backend on a real server that is reachable over the internet.
- Do not put your MongoDB Atlas connection string in frontend code.
- Make sure CORS allows your GitHub Pages origin in `CLIENT_URL`.
- Start the app with the backend start command, for example:

```bash
npm start
```

## 2) Deploy the frontend to GitHub Pages

The frontend is static. GitHub Pages can host the built files.

### Set the frontend API URL

Create or update the frontend environment before building:

```env
VITE_API_URL=https://your-render-or-railway-app.example.com/api
```

Then rebuild:

```bash
cd frontend
npm install
npm run build
```

### GitHub Actions deploy setup

The repo contains a deploy workflow in:

```text
.github/workflows/deploy.yml
```

It builds the frontend and publishes the `frontend/dist` folder to the GitHub Pages branch.

## 3) Final production configuration

Set these values for the live app:

```env
# Backend
MONGODB_URI=mongodb+srv://...
CLIENT_URL=https://your-github-user.github.io
CTI_SOURCE_URL=https://ctidigest.com/

# Frontend
VITE_API_URL=https://your-render-or-railway-app.example.com/api
```

## 4) Verify the deployment

- Open the GitHub Pages site
- Confirm the dashboard loads
- Confirm the frontend can reach the backend API
- Confirm MongoDB is connected from the backend
- Confirm the app works without exposing secrets in the browser

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
