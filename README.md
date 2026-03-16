# Match Widget Embed Configurator

A full-stack SaaS-style web application for non-technical users to configure and embed sports match widgets.

## Stack

- Frontend: React + Vite, TailwindCSS, shadcn-style UI components, Framer Motion, React Colorful, React Hook Form + Zod
- Backend: Node.js + Express, Multer, Zod, Helmet, CORS
- AI: Google Gemini via secure backend proxy
- Testing: Vitest + Testing Library (frontend), Jest + Supertest (backend)

## Features Implemented

- `/embed/configure` two-column dashboard (config panel + live preview)
- Match ID validation with loading and error states
- Theme customization: primary, secondary, accent, font, border radius, size, light/dark
- Logo upload (PNG/SVG/JPG, max 2MB)
- Live preview updates instantly on changes
- Embed code generator with copy, download, and React snippet export
- AI theme generator from uploaded logo palette
- AI integration examples generator for HTML, React, WordPress, Next.js
- Device preview switch (desktop/mobile)
- Save theme presets to local storage
- Security protections: CSP headers, sanitized inputs, backend API key isolation, upload validation

## Project Structure

- frontend/
  - src/components/MatchPreview
  - src/components/ThemeConfigurator
  - src/components/EmbedCodeGenerator
  - src/components/ColorPicker
  - src/components/LogoUploader
  - src/pages/EmbedConfigure
- backend/
  - routes/aiRoutes.js
  - routes/matchRoutes.js
  - routes/uploadRoutes.js
  - services/geminiService.js

## Setup

1. Install dependencies:

```bash
npm install
npm install --prefix frontend
npm install --prefix backend
```

2. Configure environment variables:

Create `backend/.env` from `backend/.env.example`:

```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
```

3. Start development servers:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## API Endpoints

- `GET /api/match/:id`
- `POST /api/logo/upload` (multipart/form-data, field name `logo`)
- `POST /api/ai/theme`
- `POST /api/ai/embed-examples`

## Test Commands

Run all tests:

```bash
npm run test
```

Run frontend build:

```bash
npm run build
```

## Notes

- Gemini API key is never exposed to the frontend.
- If Gemini key is not present, backend returns safe fallback theme/examples.
- Uploaded logos are stored in `backend/uploads` and served via `/uploads`.
