import postgres from "postgres";

const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };

/** Neon's copy button adds channel_binding=require, which the postgres driver rejects as an unknown setting. */
export function cleanDatabaseUrl(raw: string) {
  const url = new URL(raw);
  url.searchParams.delete("channel_binding");
  return url.toString();
}

export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  // prepare: false because Neon's -pooler host sits behind a connection pooler
  globalForDb.sql ??= postgres(cleanDatabaseUrl(process.env.DATABASE_URL), { max: 5, prepare: false, connect_timeout: 15, idle_timeout: 30 });
  return globalForDb.sql;
}

const SCHEMA = `
create table if not exists channels (
  id text primary key,
  name text not null,
  platform text not null,
  picture text,
  profile text
);
create table if not exists posts (
  id text primary key,
  channel_id text,
  platform text not null,
  content text not null default '',
  published_at timestamptz,
  state text,
  url text,
  source text not null default 'postiz',
  impressions integer,
  likes integer,
  comments integer,
  shares integer,
  clicks integer,
  updated_at timestamptz not null default now()
);
create index if not exists posts_platform_date on posts (platform, published_at desc);
create table if not exists account_buckets (
  channel_id text not null,
  week integer not null,
  impressions integer not null default 0,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  bookmarks integer not null default 0,
  captured_at timestamptz not null default now(),
  primary key (channel_id, week)
);
create table if not exists daily_metrics (
  platform text not null,
  day date not null,
  impressions integer,
  engagements integer,
  updated_at timestamptz not null default now(),
  primary key (platform, day)
);
do $$ begin
  -- One time: earlier imports read the two side by side top post tables as one, so their numbers may belong to the wrong post.
  -- They are cleared once, together with adding the engagements column, and come back when the export is uploaded again.
  if not exists (select 1 from information_schema.columns where table_name = 'posts' and column_name = 'engagements') then
    delete from posts where source = 'import' and platform = 'linkedin';
    alter table posts add column engagements integer;
  end if;
end $$;
create table if not exists advisories (
  day date primary key,
  generated_at timestamptz not null,
  data jsonb not null,
  coach jsonb,
  coach_error text,
  model text
);
alter table daily_metrics add column if not exists likes integer;
alter table daily_metrics add column if not exists comments integer;
alter table daily_metrics add column if not exists shares integer;
alter table daily_metrics add column if not exists clicks integer;
alter table posts add column if not exists external_id text;
create index if not exists posts_external on posts (platform, external_id);
update posts set external_id = coalesce(substring(url from '/status/(\\d+)'), substring(url from 'urn:li:(?:activity|share|ugcPost):(\\d+)')) where external_id is null and url is not null;
create table if not exists connections (
  provider text primary key,
  data text not null,
  updated_at timestamptz not null default now()
);
create table if not exists sync_state (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
create table if not exists comments (
  id text primary key,
  platform text not null,
  post_id text,
  post_ref text,
  external_id text,
  author_name text not null default '',
  author_handle text,
  author_url text,
  body text not null,
  commented_at timestamptz,
  source text not null default 'manual',
  status text not null default 'new',
  comment_url text,
  likes integer,
  reply_text text,
  replied_at timestamptz,
  reply_via text,
  reply_external_id text,
  created_at timestamptz not null default now(),
  unique (platform, external_id)
);
create index if not exists comments_status on comments (status, commented_at desc);
create index if not exists comments_post on comments (post_id);
create table if not exists drafts (
  id text primary key,
  platform text not null,
  status text not null default 'draft',
  title text not null default '',
  content text not null default '',
  thread jsonb not null default '[]'::jsonb,
  pillar text,
  source text not null default 'manual',
  parent_id text,
  parent_post_id text,
  scheduled_for timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists drafts_status on drafts (status, updated_at desc);
create table if not exists templates (
  id text primary key,
  name text not null,
  platform text not null default 'both',
  kind text not null default 'template',
  body text not null,
  uses integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists queue_slots (
  id text primary key,
  platform text not null,
  weekday integer not null,
  time text not null,
  unique (platform, weekday, time)
);
create table if not exists pillars (
  id text primary key,
  name text not null,
  keywords jsonb not null default '[]'::jsonb,
  position integer not null default 0
);
alter table comments add column if not exists kind text not null default 'comment';
alter table comments add column if not exists follow_up_at timestamptz;
create table if not exists reply_templates (
  id text primary key,
  name text not null,
  body text not null,
  platform text not null default 'both',
  uses integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists leads (
  id text primary key,
  platform text not null,
  name text not null,
  handle text,
  profile_url text,
  source text not null default 'manual',
  stage text not null default 'new',
  value numeric,
  notes text not null default '',
  comment_id text,
  next_step_at timestamptz,
  last_contact_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leads_stage on leads (stage, updated_at desc);
create table if not exists targets (
  id text primary key,
  platform text not null,
  name text not null,
  handle text,
  profile_url text,
  note text not null default '',
  topics text not null default '',
  active boolean not null default true,
  last_engaged_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists engagement_log (
  id text primary key,
  day date not null,
  target_id text not null,
  note text,
  created_at timestamptz not null default now(),
  unique (day, target_id)
);
create table if not exists post_snapshots (
  post_id text not null,
  taken_at timestamptz not null default now(),
  impressions integer,
  likes integer,
  comments integer,
  shares integer,
  clicks integer,
  primary key (post_id, taken_at)
);
create table if not exists alerts (
  id text primary key,
  post_id text,
  kind text not null,
  title text not null,
  detail text not null default '',
  level text not null default 'info',
  seen boolean not null default false,
  created_at timestamptz not null default now(),
  unique (post_id, kind)
);
create table if not exists goals (
  id text primary key,
  platform text not null,
  metric text not null,
  period text not null,
  target numeric not null,
  created_at timestamptz not null default now()
);
create table if not exists follower_log (
  platform text not null,
  day date not null,
  total integer,
  gained integer,
  lost integer,
  source text not null default 'manual',
  primary key (platform, day)
);
create table if not exists writing_assets (
  id text primary key,
  kind text not null,
  name text not null,
  body text not null,
  platform text not null default 'both',
  active boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists writing_assets_kind on writing_assets (kind, position);
create table if not exists channel_metrics (
  channel_id text not null,
  label text not null,
  day date not null,
  total numeric not null,
  primary key (channel_id, label, day)
);
`;

// Pages run several queries at once and each asks for the schema. They all share one run, because creating the same table from two
// connections at the same time can fail in Postgres.
let ensuring: Promise<void> | null = null;
export function ensureSchema() {
  ensuring ??= db().unsafe(SCHEMA).then(() => undefined).catch((e) => {
    ensuring = null;
    throw e;
  });
  return ensuring;
}
