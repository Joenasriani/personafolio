create extension if not exists pgcrypto;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  profession text not null,
  description text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.source_links (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  url text not null,
  source_type text,
  status text not null default 'queued',
  created_at timestamptz not null default now()
);

create table if not exists public.crawled_pages (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  source_link_id uuid references public.source_links(id) on delete set null,
  url text not null,
  title text,
  raw_text text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.extracted_facts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  page_id uuid references public.crawled_pages(id) on delete set null,
  label text not null,
  value text not null,
  confidence text,
  source_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  page_id uuid references public.crawled_pages(id) on delete set null,
  media_type text not null,
  title text,
  source_url text,
  media_url text,
  embed_available boolean not null default false,
  thumbnail_url text,
  role_of_person text,
  relevance_score numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.generated_outputs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  output_type text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
