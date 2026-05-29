# Deploying to Cloudflare Pages

This site runs entirely on **Cloudflare Pages**: static HTML/CSS/JS plus
serverless API functions in `functions/`, backed by **Cloudflare D1**
(SQLite) for content and **Cloudflare R2** for uploaded images.

## Architecture

| Piece            | Where                         |
|------------------|-------------------------------|
| Static site      | repo root (served as-is)      |
| API              | `functions/api/*.js` (Pages Functions) |
| Image serving    | `functions/img/[[path]].js`   |
| Database         | Cloudflare D1 `global-shapers-db` |
| Uploaded images  | Cloudflare R2 `global-shapers-media` |
| Schema           | `schema.sql`                  |
| Seed data        | `seed.sql` (members + events; **projects start empty**) |

### Authentication

Admin auth is server-side. `POST /api/auth/login` checks the password
against the `ADMIN_PASSWORD` secret and, on success, sets an **HttpOnly,
Secure, SameSite=Strict** cookie containing an HMAC-signed token (signed
with `SESSION_SECRET`, 8-hour expiry). Every write endpoint verifies that
cookie server-side — there is no client-side password and no fallback.

### API endpoints

Public:
- `GET  /api/data?type=projects|members|events` — read content
- `POST /api/submit-form` — contact form
- `GET  /img/<key>` — serve an uploaded image from R2

Admin (require valid session cookie):
- `POST /api/auth/login` / `POST /api/auth/logout` / `GET /api/auth/session`
- `POST /api/data?type=...` — replace a dataset
- `POST /api/upload` — upload an image to R2 (multipart, field `file`)
- `GET  /api/get-submissions`, `GET /api/export-csv`

## One-time setup

1. **Install deps & log in**
   ```bash
   npm install
   npx wrangler login
   ```

2. **Create the D1 database**
   ```bash
   npx wrangler d1 create global-shapers-db
   ```
   Copy the printed `database_id` into `wrangler.toml` (replace
   `local-global-shapers-db`).

3. **Create the R2 bucket**
   ```bash
   npx wrangler r2 bucket create global-shapers-media
   ```
   (The binding name `MEDIA` in `wrangler.toml` must stay as-is.)

4. **Create the schema and seed data on the remote DB**
   ```bash
   npm run seed                 # regenerate seed.sql (members + events only)
   npm run db:init:remote       # applies schema.sql + seed.sql to Cloudflare D1
   ```
   Projects are intentionally **not** seeded — the admin creates them
   through the admin panel, uploading pictures directly.

5. **Set the admin secrets** (no fallbacks exist in code)
   ```bash
   npx wrangler pages secret put ADMIN_PASSWORD
   npx wrangler pages secret put SESSION_SECRET
   ```
   - `ADMIN_PASSWORD` — the admin login password.
   - `SESSION_SECRET` — a long random string used to sign session
     cookies. Generate one with: `openssl rand -hex 32`.
     Changing it later logs everyone out (invalidates existing cookies).

## Deploy

**Via Git (recommended):** Connect the GitHub repo in the Cloudflare
dashboard → Pages → Create project. Build command: none. Build output
directory: `/`. Every push to `main` auto-deploys.

**Via CLI:**
```bash
npm run deploy        # wrangler pages deploy .
```

## Local development

Local dev uses a local SQLite file and a local R2 directory — **no
Cloudflare login required**.

```bash
npm run seed            # generate seed.sql
npm run db:init:local   # create + seed the local D1
cat > .dev.vars <<'EOF'
ADMIN_PASSWORD=globalshaper2025
SESSION_SECRET=dev-only-insecure-secret-change-me
EOF
npm run dev             # wrangler pages dev . on http://localhost:8788
```

`.dev.vars` is gitignored. R2 uploads in local dev are stored under
`.wrangler/` and served by `/img/...` just like production.

## Managing content

- Go to `/admin.html`, log in with `ADMIN_PASSWORD`.
- **Projects**: "Add Project" → fill details, choose a picture file
  (uploaded to R2) or paste an image URL, save.
- **Members**: "Add Member" → same picture-upload flow. Each member card
  has a **Set Alumni / Set Active** button to flip their status instantly;
  the type can also be set from the member form.
- **Submissions**: contact-form entries, viewable and CSV-exportable.

The `data/*.json` files are only the initial member/event seed; they are
not read at runtime. To re-seed (destructive — overwrites D1 content):
```bash
npm run seed && npm run db:init:remote
```

## Notes

- **Submissions** are individual D1 rows (atomic inserts), fixing the
  read-modify-write race the old Vercel Blob version had.
- **Image limits**: uploads accept JPEG/PNG/WebP/GIF up to 5 MB
  (enforced in `functions/api/upload.js`).
- **Session length**: 8 hours; admins re-login after expiry. The admin UI
  detects a 401 and returns to the login screen automatically.
