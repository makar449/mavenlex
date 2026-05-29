# MavenLex v5.7.1 — Local and Deployment Clarity

This release fixes the most common confusion between local development, backend API, and deployed production builds.

## Correct local development flow

Use:

```bash
npm install
npm run dev
```

Open only:

```text
http://localhost:5173
```

This is the live Vite frontend. It updates when the source code changes.

## Backend URL

The backend runs on:

```text
http://localhost:3001
```

In development it is API-only. Use it for health checks:

```text
http://localhost:3001/api/health
```

Do not use `http://localhost:3001` as the app URL while developing. The visible app URL is `http://localhost:5173`.

## Production-like local run

To test the built production app locally:

```bash
npm run serve:production-local
```

Then open:

```text
http://localhost:3001
```

This mode first builds `dist/`, then serves it through Express.

## Why deployed site may not change

Downloading or running a new ZIP locally does not update an old public deployment. To update the public site, the new project version must be uploaded/pushed to the deployment provider and redeployed.

Typical causes of seeing an old site:

- the deployed platform is still connected to an old GitHub repository/branch;
- new ZIP files were downloaded locally but not uploaded to the deployment provider;
- the browser is opening the old production URL, not `localhost:5173`;
- the backend URL `localhost:3001` is being opened during development instead of the Vite frontend URL;
- the deployment root directory is wrong;
- the platform did not rebuild after changes.

## Quick verification

Run:

```bash
npm run deployment-version
```

Then compare with:

```text
http://localhost:3001/api/health
```

The version should show `5.7.1-local-deploy-clarity` on the updated backend.
