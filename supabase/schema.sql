create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_si text not null default '',
  slug text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  title_en text not null,
  title_si text not null default '',
  description_en text not null default '',
  description_si text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  image_url text not null,
  active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tracking_code uuid not null unique default gen_random_uuid(),
  invitation_id uuid references public.invitations(id) on delete set null,
  invitation_title text not null,
  customer_name text not null,
  contact_details text not null,
  event_date date,
  event_details text not null default '',
  status text not null default 'received'
    check (status in ('received', 'designing', 'review', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  feedback text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists invitations_set_updated_at on public.invitations;
create trigger invitations_set_updated_at
before update on public.invitations
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.track_order(order_code uuid)
returns table (
  tracking_code uuid,
  invitation_title text,
  customer_name text,
  status text,
  created_at timestamptz,
  event_date date
)
language sql
security definer
set search_path = public
as $$
  select o.tracking_code, o.invitation_title, o.customer_name, o.status,
         o.created_at, o.event_date
  from public.orders o
  where o.tracking_code = order_code
  limit 1;
$$;

revoke all on function public.track_order(uuid) from public;
grant execute on function public.track_order(uuid) to anon, authenticated;

alter table public.categories enable row level security;
alter table public.invitations enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Anyone can view active categories" on public.categories;
create policy "Anyone can view active categories"
on public.categories for select to anon, authenticated using (active or (select public.is_admin()));
drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories"
on public.categories for all to authenticated using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Anyone can view active invitations" on public.invitations;
create policy "Anyone can view active invitations"
on public.invitations for select to anon, authenticated using (active or (select public.is_admin()));
drop policy if exists "Admins manage invitations" on public.invitations;
create policy "Admins manage invitations"
on public.invitations for all to authenticated using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Anyone can place an order" on public.orders;
create policy "Anyone can place an order"
on public.orders for insert to anon, authenticated
with check (
  tracking_code is not null
  and char_length(customer_name) between 1 and 120
  and char_length(contact_details) between 1 and 240
  and char_length(event_details) <= 3000
);
drop policy if exists "Admins manage orders" on public.orders;
create policy "Admins manage orders"
on public.orders for all to authenticated using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Anyone can view approved reviews" on public.reviews;
create policy "Anyone can view approved reviews"
on public.reviews for select to anon, authenticated using (approved or (select public.is_admin()));
drop policy if exists "Anyone can submit a review" on public.reviews;
create policy "Anyone can submit a review"
on public.reviews for insert to anon, authenticated
with check (
  char_length(customer_name) between 1 and 120
  and rating between 1 and 5
  and char_length(feedback) between 1 and 2000
);
drop policy if exists "Admins manage reviews" on public.reviews;
create policy "Admins manage reviews"
on public.reviews for all to authenticated using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can view their admin record" on public.admin_users;
create policy "Admins can view their admin record"
on public.admin_users for select to authenticated using (user_id = (select auth.uid()));

grant select on public.categories, public.invitations, public.reviews to anon, authenticated;
grant insert on public.orders, public.reviews to anon, authenticated;
grant select, insert, update, delete on public.categories, public.invitations, public.orders, public.reviews to authenticated;
grant select on public.admin_users to authenticated;

insert into public.categories (name_en, name_si, slug) values
  ('Weddings', 'මංගල', 'weddings'),
  ('Birthdays', 'උපන්දිනය', 'birthdays'),
  ('Corporate', 'ආයතනික', 'corporate'),
  ('Cricket', 'ක්‍රිකට්', 'cricket')
on conflict (slug) do update set name_en = excluded.name_en, name_si = excluded.name_si;

create unique index if not exists invitations_category_title_unique
on public.invitations (category_id, title_en);

insert into public.invitations
  (category_id, title_en, title_si, description_en, description_si, price, image_url, featured)
select c.id, seed.title_en, seed.title_si, seed.description_en, seed.description_si,
       seed.price, seed.image_url, seed.featured
from (values
  ('weddings', 'The Blush Garden', 'රෝස මල් උයන', 'Soft florals, warm paper & a little bit of magic.', 'සියුම් මල්, උණුසුම් පැහැ සහ පුංචි මැජික්.', 4500, 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=85', true),
  ('birthdays', 'A Little Sunshine', 'හිරු එළියේ සතුට', 'A bright, happy hello for your favourite person.', 'ඔබේ ප්‍රියතම පුද්ගලයා වෙනුවෙන් සතුටින් පිරුණු ආරාධනාවක්.', 2800, 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=85', false),
  ('weddings', 'Sundown Promise', 'හිරු බැස යන පොරොන්දුව', 'A little golden hour, captured on paper.', 'රන්වන් සැන්දෑවක සොඳුරු මතකයක්.', 5200, 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=85', false),
  ('corporate', 'The Good Gathering', 'සොඳුරු හමුව', 'A polished invite for the people who make it happen.', 'ඔබේ විශේෂ ආයතනික හමුව සඳහා නවීන ආරාධනාවක්.', 6000, 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=85', false),
  ('cricket', 'Game Day', 'තරග දිනය', 'Bring your team together for a match to remember.', 'මතකයේ රැඳෙන තරගයකට ඔබේ කණ්ඩායම එක් කරන්න.', 3200, 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1000&q=85', true),
  ('birthdays', 'One More Candle', 'තවත් ඉටිපන්දමක්', 'A sweet little something for their biggest day.', 'ඔවුන්ගේ විශේෂ දවසට පුංචි මිහිරි තිළිණයක්.', 2500, 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1000&q=85', false)
) as seed(category_slug, title_en, title_si, description_en, description_si, price, image_url, featured)
join public.categories c on c.slug = seed.category_slug
on conflict (category_id, title_en) do update
set title_si = excluded.title_si,
    description_en = excluded.description_en,
    description_si = excluded.description_si,
    price = excluded.price,
    image_url = excluded.image_url,
    featured = excluded.featured;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('invitations', 'invitations', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public = true, file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Anyone can view invitation images" on storage.objects;
create policy "Anyone can view invitation images"
on storage.objects for select to anon, authenticated using (bucket_id = 'invitations');
drop policy if exists "Admins upload invitation images" on storage.objects;
create policy "Admins upload invitation images"
on storage.objects for insert to authenticated
with check (bucket_id = 'invitations' and (select public.is_admin()));
drop policy if exists "Admins update invitation images" on storage.objects;
create policy "Admins update invitation images"
on storage.objects for update to authenticated
using (bucket_id = 'invitations' and (select public.is_admin()))
with check (bucket_id = 'invitations' and (select public.is_admin()));
drop policy if exists "Admins delete invitation images" on storage.objects;
create policy "Admins delete invitation images"
on storage.objects for delete to authenticated
using (bucket_id = 'invitations' and (select public.is_admin()));
