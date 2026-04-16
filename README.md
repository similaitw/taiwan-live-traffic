# taiwan-live-traffic

Taiwan live traffic camera viewer built with Next.js.

## Branch Strategy

This repository uses a single long-lived branch:

- `main` is the only branch that should exist on the remote.
- Work should be merged into `main` directly or through short-lived local branches.
- Old feature branches should be deleted after their changes are consolidated.

For this project, `main` is the source of truth for deployment and releases.

## Project

- `npm run dev` to start local development
- `npm run build` to verify the production build
- `npm run start` to run the built app
