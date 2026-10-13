# No Due Management System

A role-based academic clearance dashboard for students, staff, and department administrators. The application is built as a single Next.js full-stack project: page components and API routes run from the same app.

## Project guides

- [`frontend/`](./frontend/README.md) — guide to the user interface and its source locations.
- [`backend/`](./backend/README.md) — guide to API routes, authentication, and data storage.
- [`public/showcase/`](./public/showcase/index.html) — static showcase, previewable locally and deployed to GitHub Pages.

The `frontend` and `backend` folders contain GitHub-facing guides only. The runnable source remains in the existing Next.js structure; keeping it in place preserves the current routes and build.

GitHub Pages hosts the static showcase only. The full application needs a server runtime and MongoDB; continue using `npm run dev` locally or deploy it to a Next.js-capable host.

## Main features

- Student, staff, and HOD dashboards
- Academic progress and pre-approval/final approval requests
- Staff assignment creation with due dates
- Student assignment file submissions and staff downloads
- Class, subject, staff assignment, and approval management
- Dashboard date/time display and responsive layouts

## Requirements

- Node.js 20.9 or newer
- MongoDB, local or hosted

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and configure the MongoDB connection and a private JWT secret.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

The static showcase can also be opened locally at [http://localhost:3000/showcase/index.html](http://localhost:3000/showcase/index.html).

Check the database connection at `/api/health`. Build the production app with `npm run build`, then run it with `npm start`.

## GitHub upload notes

- Do not upload `.env.local`, credentials, or other secret values.
- Keep `.env.example` in the repository as a template; it contains placeholders only.
- `node_modules`, `.next`, build output, local environment files, and TypeScript build info are excluded by `.gitignore`.
- Pull requests to `main` that update the static showcase run a validation check. After merging, the GitHub Actions workflow in `.github/workflows/pages.yml` publishes `public/showcase/` to GitHub Pages. In the repository’s **Settings → Pages**, select **GitHub Actions** as the build and deployment source.
- To propose a website update, create a branch, push it, and open a pull request to `main`. A pull request does not update the public site until it is merged; local `npm run dev` is only for testing on your computer.
