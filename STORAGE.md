# Permanent storage setup (Neon Postgres)

## What this does
- Mock/seed demand stays in code (so the board looks full on day one)
- Real traveller/operator submissions save to Postgres forever
- Without DATABASE_URL, the app falls back to temporary file storage

## Create the database (pick one)

### Option A — From Vercel (recommended)
1. Open your project on Vercel
2. Go to **Storage** → **Create Database** → **Neon**
3. Connect it to the `toursiwant` project
4. Vercel will set `DATABASE_URL` automatically
5. Redeploy

### Option B — From neon.tech
1. Sign up at https://neon.tech
2. Create a project (e.g. `toursiwant`)
3. Copy the connection string
4. In Vercel → Project → **Settings → Environment Variables**
5. Add:
   - Name: `DATABASE_URL`
   - Value: your Neon connection string
   - Environments: Production, Preview, Development
6. Redeploy the project

## Local development
1. Copy `.env.example` to `.env.local`
2. Paste your `DATABASE_URL`
3. Run `npm run dev`

## Verify
Open `/api/requests` — you should see:
`"storage": "postgres"`

If you still see `"storage": "file"`, DATABASE_URL is missing on that environment.
