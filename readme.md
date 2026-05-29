# GitHub Profile Analyzer API

A backend service built with Node.js and Express that pulls data from the GitHub public API, computes useful insights about a user's profile, and stores everything in a MySQL database.

Built as part of an internship assignment. The goal was to go beyond just fetching and storing raw data — the API also calculates a GitHub influence score, detects top languages, compares profiles, and caches results so you're not hammering the GitHub API on every request.

---

## What it does

- Fetch any GitHub user's public profile by username
- Calculate derived insights like total stars across all repos, top programming language, account age, and an overall GitHub score (0–100)
- Store everything in MySQL so you can query it later
- Skip re-fetching if a profile was analyzed recently (configurable cache window)
- Compare two users side by side with a category-by-category breakdown

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check if the server is running |
| POST | `/api/analyze/:username` | Analyze a GitHub profile and store it |
| GET | `/api/profiles` | List all analyzed profiles |
| GET | `/api/profiles/:username` | Get a single stored profile |
| GET | `/api/compare/:user1/:user2` | Compare two profiles side by side |

**Query params for `/api/profiles`:**
- `page` — page number (default: 1)
- `limit` — results per page (default: 10)
- `sort` — one of `github_score`, `followers`, `total_stars`, `public_repos`, `analyzed_at`

Add `?force=true` to the analyze endpoint to bypass the cache and re-fetch fresh data.

---

## Insights stored per profile

Beyond the basic stuff (followers, repos, bio), the API also calculates:

- **Total stars** — sum of stars across all public repos
- **Total forks** — sum of forks across all public repos
- **Top language** — most frequently used language across repos
- **Languages used** — full list of all languages detected
- **Account age** — how many days old the GitHub account is
- **Avg stars per repo** — total stars divided by repo count
- **Profile README** — whether the user has set up a GitHub profile README
- **GitHub score** — a 0–100 influence score based on followers, stars, forks, repos, and account age

---

## Tech stack

- Node.js + Express
- MySQL (via mysql2)
- GitHub REST API v3
- Deployed on Railway

---

## Project structure

```
backend/
├── config/
│   └── db.js               # MySQL connection pool
├── controllers/
│   └── profileController.js
├── middleware/
│   └── errorHandler.js
├── models/
│   └── profileModel.js     # All database queries
├── routes/
│   └── profileRoutes.js
├── services/
│   └── githubService.js    # GitHub API calls + score calculation
├── index.js
├── schema.sql
├── package.json
└── railway.json
```

---

## Running locally

**1. Clone the repo**

```bash
git clone https://github.com/YOUR_USERNAME/educase-assignment.git
cd educase-assignment/backend
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up environment variables**

Create a `.env` file in the `backend/` folder:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=github_analyzer
GITHUB_TOKEN=your_github_token_here
CACHE_DURATION_MINUTES=60
```

Getting a GitHub token: go to GitHub → Settings → Developer settings → Personal access tokens → Generate new token. No special scopes needed, public data is accessible without them — the token just increases your rate limit from 60 to 5000 requests/hour.

**4. Create the database**

```bash
mysql -u root -p < schema.sql
```

**5. Start the server**

```bash
# development
npm run dev

# production
npm start
```

Server runs at `http://localhost:3000`

---

## Example usage

Analyze a profile:
```bash
curl -X POST http://localhost:3000/api/analyze/torvalds
```

Get all stored profiles sorted by score:
```bash
curl http://localhost:3000/api/profiles?sort=github_score
```

Compare two users:
```bash
curl http://localhost:3000/api/compare/torvalds/gaearon
```

---



## Postman collection
Import `postman_collection.json` to get all endpoints pre-configured. Change the `base_url` variable to the live URL for testing against production.
