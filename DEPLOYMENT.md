# DataFlow Deployment

This project is best deployed as one GitHub repository with two hosted apps:

- `client/` on Vercel
- `server/` on Render

## Files Not To Commit

Keep these out of GitHub:

- `server/.env`
- `server/data-pilot.db`
- `server/temp/`
- `client/node_modules/`
- `client/dist/`

The root `.gitignore` already ignores them.

## Server On Render

Create a new Render Web Service from this GitHub repository.

Use these settings:

- Root Directory: `server`
- Runtime: Go
- Build Command: `go build -o dataflow-server .`
- Start Command: `./dataflow-server`

Set environment variables in Render:

```txt
JWT_SECRET=use-a-long-random-secret
SQLITE_PATH=data-pilot.db
FRONTEND_URL=https://your-vercel-app.vercel.app
```

After deployment, copy the Render service URL. It will look like:

```txt
https://your-server-name.onrender.com
```

## Client On Vercel

Create a new Vercel project from the same GitHub repository.

Use these settings:

- Framework Preset: Vite
- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`

Set this environment variable in Vercel:

```txt
VITE_API_URL=https://your-server-name.onrender.com
```

Redeploy the Vercel app after adding the environment variable.

## Local Development

Run the server:

```bash
cd server
go run main.go
```

Run the client:

```bash
cd client
npm run dev
```

The client defaults to `http://localhost:8080` if `VITE_API_URL` is not set.
