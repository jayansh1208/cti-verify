# How to Run the Frontend

## 1) Open a terminal in the frontend folder

```bash
cd frontend
```

## 2) Install dependencies

```bash
npm install
```

## 3) Create your environment file

```bash
copy .env.example .env
```

On Linux/macOS:

```bash
cp .env.example .env
```

Then update `.env` with your deployed backend URL:

```env
VITE_API_URL=http://localhost:5000/api
```

For production or Vercel deployment:

```env
VITE_API_URL=https://your-backend-project.vercel.app/api
```

## 4) Start the frontend

```bash
npm run dev
```

The app will run at:

```text
http://localhost:5173
```

## 5) Build for production

```bash
npm run build
```

This creates the static files used for GitHub Pages or other static hosting.
