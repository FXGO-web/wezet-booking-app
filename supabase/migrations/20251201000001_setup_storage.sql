-- Create the 'avatars' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Enable RLS on storage.objects (it's usually enabled by default, but good to be sure if we were creating the table, but here we just add policies)
-- Note: storage.objects is a system table, we just add policies.

-- Policy: Public Read Access
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Policy: Authenticated users can upload
create policy "Authenticated users can upload"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'avatars' );

-- Policy: Users can update their own files (assuming we name files with user_id prefix or similar, but for now allow authenticated to update for simplicity in this transition)
create policy "Authenticated users can update"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'avatars' );

-- Policy: Authenticated users can delete
create policy "Authenticated users can delete"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'avatars' );
