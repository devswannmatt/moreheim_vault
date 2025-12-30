# Moreheim Vault - Express App

Simple Express server for Moreheim Vault with optional MongoDB persistence.

Run locally:

```bash
npm install
npm start
# or set a custom port
PORT=4000 npm start
```

Environment
- Environment variables are loaded from `.env` (use `.env.example` as a template). The app uses `dotenv` to auto-load variables on start.
- Requires PORT and MONGODB_URI to be set, otherwise system will not start.

MongoDB
- Set `MONGODB_URI` to point to your MongoDB server.
- Database name: `moreheim_vault`. Collection used: `items`.

Endpoints:
- `GET /` - basic info
- `GET /health` - health check
- `GET /items` - list all items (requires MongoDB)
- `POST /items` - create an item (requires MongoDB). JSON body is inserted.

Templating
- The app now supports HTML rendering with Handlebars via `express-handlebars`.
- Visit `/` in a browser to see the rendered home page. API responses still return JSON when not requesting HTML.

Material Dashboard
- A simple Material-styled dashboard is available at `/dashboard`.
- Static assets (client JS) are served from the `public/` directory.
