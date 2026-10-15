# How to Run the Backend

## 1) Open a terminal in the backend folder

```bash
cd backend
```

## 2) Install dependencies

```bash
npm install
```

## 3) Create your environment file

Copy the example file:

```bash
copy .env.example .env
```

On Linux/macOS:

```bash
cp .env.example .env
```

Then update `.env` with your real values:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/cti_verify
CLIENT_URL=http://localhost:5173
CTI_SOURCE_URL=https://ctidigest.com/
```

For a hosted deployment, use a real MongoDB Atlas URI instead of the local one, for example:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/cti_verify
CLIENT_URL=https://your-github-user.github.io
```

## 4) Seed the MongoDB database

```bash
npm run seed
```

## 5) Start the backend

```bash
npm run dev
```

The API will run at:

```text
http://localhost:5000
```

## Useful commands

```bash
npm run bson:check
npm run working-set:seed
npm run cache:monitor
npm run cti:watch
```
