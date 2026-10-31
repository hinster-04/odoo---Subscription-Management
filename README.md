# Brightloop website prototype

A responsive React + Vite frontend prototype for the Brightloop public website and authentication screens.

## Pages
- `/` — Public landing page
- `/login` — Login UI
- `/signup` — Signup UI with client-side validation
- `/forgot-password` — Password reset UI

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Notes
- The six subscription cards use illustrative product names and sample INR prices. These are demo content, not facts from the Brightloop brief.
- The first three cards are visible. The remaining three show blurred previews with a sign-in lock overlay.
- Authentication is intentionally not implemented. Forms validate basic input and show an integration notice instead of creating sessions or sending requests.
- Connect API requests in the submit handlers in `src/App.jsx` when the backend is ready.
- For deployment with direct URLs such as `/login`, configure the web server to rewrite application routes to `index.html`.
