API-only backend built with [Next.js](https://nextjs.org) (App Router route handlers).

## Getting Started

Create a local env file and set your MongoDB connection string:

```bash
cp .env.example .env.local
```

Windows (PowerShell):

```powershell
Copy-Item .env.example .env.local
```

Install deps and run the dev server:

```bash
npm ci
npm run dev
```

Server runs on http://localhost:3000.

## API

All endpoints are JSON.

Base URL (dev): `http://localhost:3000`

### CORS

For browser-based frontends, all API routes:

- include `Access-Control-Allow-*` headers
- support `OPTIONS` (preflight) requests

Configure allowed origin via `CORS_ORIGIN` (defaults to `*`).

### Data Model

Stored item shape:

```json
{
	"id": "uuid",
	"name": "string",
	"description": "string",
	"category": "string",
	"isAdultOnly": true,
	"type": "group | channel",
	"link": "string",
	"createdAt": "ISO-8601 timestamp"
}
```

### GET /api/groups

Returns saved Telegram groups (newest first).

Query params:

- `page` (optional) — page number (default: `1`)
- `limit` (optional) — items per page (default: `20`, max: `100`)

Response `200`:

```json
{
	"page": 1,
	"limit": 20,
	"total": 123,
	"totalPages": 7,
	"items": [
		{
			"id": "...",
			"name": "...",
			"description": "...",
			"category": "...",
			"isAdultOnly": false,
			"type": "group",
			"link": "https://t.me/...",
			"createdAt": "2026-03-27T00:00:00.000Z"
		}
	]
}
```

Example:

```bash
curl http://localhost:3000/api/groups
curl "http://localhost:3000/api/groups?page=2&limit=50"
```

### GET /api/channels

Returns saved Telegram channels (newest first).

Query params:

- `page` (optional) — page number (default: `1`)
- `limit` (optional) — items per page (default: `20`, max: `100`)

Response `200`:

```json
{
	"page": 1,
	"limit": 20,
	"total": 123,
	"totalPages": 7,
	"items": [/* TelegramLink (type=channel) */]
}
```

Example:

```bash
curl http://localhost:3000/api/channels
curl "http://localhost:3000/api/channels?page=1&limit=10"
```

### GET /api/trending/groups

Returns “trending” groups (currently implemented as all groups, newest first).

Query params:

- `filter` (optional) — `trending`, `latest`, or `hot` (default: `trending`)
- `page` (optional) — page number (default: `1`)
- `limit` (optional) — items per page (default: `20`, max: `100`)

Note: until the trending algorithm is defined, `trending`, `latest`, and `hot` all return newest-first.

Response `200`:

```json
{
	"page": 1,
	"limit": 20,
	"total": 123,
	"totalPages": 7,
	"items": [/* TelegramLink (type=group) */]
}
```

Example:

```bash
curl http://localhost:3000/api/trending/groups
curl "http://localhost:3000/api/trending/groups?page=2&limit=50"
curl "http://localhost:3000/api/trending/groups?filter=hot"
```

### GET /api/trending/channels

Returns “trending” channels (currently implemented as all channels, newest first).

Query params:

- `filter` (optional) — `trending`, `latest`, or `hot` (default: `trending`)
- `page` (optional) — page number (default: `1`)
- `limit` (optional) — items per page (default: `20`, max: `100`)

Note: until the trending algorithm is defined, `trending`, `latest`, and `hot` all return newest-first.

Response `200`:

```json
{
	"page": 1,
	"limit": 20,
	"total": 123,
	"totalPages": 7,
	"items": [/* TelegramLink (type=channel) */]
}
```

Example:

```bash
curl http://localhost:3000/api/trending/channels
curl "http://localhost:3000/api/trending/channels?page=1&limit=10"
curl "http://localhost:3000/api/trending/channels?filter=latest"
```

### GET /api/search

Searches saved items by substring match over `name`, `description`, `category`, and `link`.

Query params:

- `query` (required) — search text
- `q` (optional) — alias for `query`
- `type` (optional) — `group` or `channel`
- `page` (optional) — page number (default: `1`)
- `limit` (optional) — items per page (default: `20`, max: `100`)

Response `200`:

```json
{
	"page": 1,
	"limit": 20,
	"total": 123,
	"totalPages": 7,
	"items": [/* TelegramLink[] */]
}
```

Errors:

- `400` `{ "error": "query is required (use ?query=... or ?q=...)" }`

Examples:

```bash
curl "http://localhost:3000/api/search?query=crypto"
curl "http://localhost:3000/api/search?q=news&type=channel"
curl "http://localhost:3000/api/search?query=crypto&page=3&limit=25"
```

### POST /api/links

Adds a new Telegram group or channel.

Request body (JSON):

```json
{
	"name": "My Channel",
	"description": "Short description",
	"category": "News",
	"isAdultOnly": false,
	"type": "channel",
	"link": "https://t.me/example"
}
```

Validation rules:

- `name`: required, non-empty string, max 200 chars
- `description`: required, non-empty string, max 2000 chars
- `category`: required, non-empty string, max 100 chars
- `isAdultOnly`: required boolean
- `type`: required, must be `group` or `channel`
- `link`: required, non-empty string, max 2048 chars, must be unique

Response `201`:

```json
{
	"item": {
		"id": "...",
		"name": "...",
		"description": "...",
		"category": "...",
		"isAdultOnly": false,
		"type": "channel",
		"link": "https://t.me/example",
		"createdAt": "2026-03-27T00:00:00.000Z"
	}
}
```

Errors:

- `400` `{ "error": "invalid JSON" }`
- `400` `{ "error": "...validation message..." }` (missing/invalid fields)
- `409` `{ "error": "duplicate link", "existing": { /* existing item */ } }`

Examples:

```bash
curl -X POST http://localhost:3000/api/links \
	-H "Content-Type: application/json" \
	-d "{\"name\":\"My Group\",\"description\":\"Desc\",\"category\":\"Chat\",\"isAdultOnly\":false,\"type\":\"group\",\"link\":\"https://t.me/mygroup\"}"
```

## Storage

Data is stored in MongoDB (database: `MONGODB_DB` or `telegram_links`, collection: `links`).

Environment:

- `MONGODB_URI` (required)
- `MONGODB_DB` (optional)

Implementation locations:

- Routes: [src/app/api](src/app/api)
- Storage + validation: [src/lib/telegramLinks.ts](src/lib/telegramLinks.ts)

## Notes

- Next.js does not use Vite as its dev server/bundler; it uses Turbopack or Webpack.
