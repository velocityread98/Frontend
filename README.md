# Velocity Read - Frontend

A tiny single-page React app (Vite) with a dark hero section that matches the provided design. Header includes a Sign in button.

## Develop locally

1. Install dependencies
2. Start dev server

```bash
npm install
npm run dev
```

Then open the shown localhost URL.

## Build

```bash
npm run build
npm run preview
```

Output goes to `dist/`, suitable for Azure Static Web Apps.

## Customize
- Edit `src/App.jsx` for content and layout
- Edit `src/styles.css` for colors/spacing. 

## Authentication (Clerk)

This app is wired with Clerk for auth in a Vite/React setup.

1. Install deps (already in this repo):
	- `@clerk/clerk-react` 
2. Create `.env.local` at the project root with:

```
VITE_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

3. In the Clerk Dashboard, copy your Publishable Key and paste in `.env.local`.
4. The header shows Sign in/Sign up when signed out and a user menu when signed in.

Notes:
- For Next.js, use `@clerk/nextjs` and `clerkMiddleware()` per Clerk App Router docs. This project uses Vite + React, so we use `@clerk/clerk-react`.