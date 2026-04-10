# Personafolio MVP Setup

Personafolio is a source-backed identity and media folio builder.

## Current MVP scope

- landing page
- submission form
- job creation API route
- environment helpers
- Supabase-ready schema

## Environment variables

Create a `.env.local` file based on `.env.example`.

Required names:

- `PERSONAFOLIO_OPENROUTER_API`
- `PERSONAFOLIO_FIRECRAWL_API`
- `PERSONAFOLIO_APIFY_API_TOKEN`
- `PERSONAFOLIO_SUPABASE_URL`
- `PERSONAFOLIO_SUPABASE_ANON_KEY`
- `PERSONAFOLIO_SUPABASE_SERVICE_ROLE_KEY`

## Install

```bash
npm install
npm run dev
```

## Database

Run the SQL in `supabase/schema.sql` inside your Supabase SQL editor.

## Next recommended implementation steps

1. wire `/api/jobs` to write `jobs` and `source_links` to Supabase
2. add Firecrawl ingestion route
3. add OpenRouter extraction route
4. store extracted facts and media items
5. generate HTML folio output
6. add result page and job status page
