# Backend

This folder is a GitHub-facing guide to the backend; it is not a separate server package. API handlers run inside the root Next.js application.

## Source locations

- `app/api/` — authentication, classes, subjects, assignment, approval, dashboard, and health endpoints
- `lib/auth.ts` — session cookies, JWT signing, and password helpers
- `lib/mongo.ts` — MongoDB connection
- `lib/` — shared validation and student/class helpers

## Configuration

Configure `MONGODB_URI`, `MONGODB_DB`, and a strong private `JWT_SECRET` in `.env.local`. Use `.env.example` as a placeholder template, and never upload `.env.local` or real credentials to GitHub.

Assignment submission files are limited and stored with submission records in MongoDB. API access is protected by the signed-in user's role and class/subject assignment.
