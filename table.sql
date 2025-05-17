create table keywords (
  id uuid default uuid_generate_v4() primary key,
  keyword text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);