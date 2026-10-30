<<<<<<< HEAD
# Aradhana Invitation

A Sinhala/English invitation shop built with Next.js, Supabase and Tailwind CSS. Visitors can switch between English and Sinhala using the language control in the header. The gallery has example designs until your Supabase project is connected. Orders, order tracking, reviews and studio administration use Supabase.
=======
# Mali Invitation Studio

A Sinhala/English invitation shop built with Next.js, Supabase and Tailwind CSS. The gallery has example designs until your Supabase project is connected. Orders, order tracking, reviews and studio administration use Supabase.
>>>>>>> f772ce5dac82b253244927031c6854178a440a5f

## Run locally

1. Install Node.js 20.9 or later.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a Supabase project at [supabase.com](https://supabase.com).
4. In the Supabase SQL Editor, run the complete [`supabase/schema.sql`](./supabase/schema.sql) script. It creates the tables, row-level security policies, image bucket, and starter categories/designs.
5. In Supabase **Project Settings → API**, copy the project URL and publishable (or legacy anon) key into a new `.env.local` file in the project root:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
   ```

   `.env.example` shows the required variable names. Never put a Supabase `service_role` key in a `NEXT_PUBLIC_` variable or commit it to source control.

6. Create an admin account in Supabase **Authentication → Users**. Copy its user UUID and run this in the SQL Editor, replacing the example UUID:

   ```sql
   insert into public.admin_users (user_id)
   values ('00000000-0000-0000-0000-000000000000');
   ```

7. Start the website:

   ```bash
   npm run dev
   ```

<<<<<<< HEAD
   Visit [http://localhost:3000](http://localhost:3000). The studio admin page is not linked from the public site; open `/admin` directly and sign in with the admin account's email and password.
=======
   Visit [http://localhost:3000](http://localhost:3000) and sign in to `/admin` using that Supabase account.
>>>>>>> f772ce5dac82b253244927031c6854178a440a5f

## Included features

- Searchable invitation gallery and wedding, birthday, corporate, and cricket categories.
<<<<<<< HEAD
- English and Sinhala customer-site language toggle.
- Customer order form with a unique tracking code.
- Private-by-default order records and a tracking RPC that only returns the order matching its unguessable code.
- Review submission and admin approval before publication.
- Private `/admin` sign-in, invitation/category management, image uploads, order status updates, and review moderation.
=======
- Customer order form with a unique tracking code.
- Private-by-default order records and a tracking RPC that only returns the order matching its unguessable code.
- Review submission and admin approval before publication.
- Admin sign-in, invitation/category management, image uploads, order status updates, and review moderation.
>>>>>>> f772ce5dac82b253244927031c6854178a440a5f
- Supabase row-level security and a public `invitations` image bucket restricted to admin uploads.

## Deploy to Vercel

1. Push this project to a Git provider that Vercel can access, then import it from [vercel.com/new](https://vercel.com/new).
2. In Vercel **Project Settings → Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the environments you will deploy.
3. Deploy. Vercel detects the Next.js build and uses `npm run build`.
4. In Supabase **Authentication → URL Configuration**, set the Site URL to the deployed Vercel URL. Add your Vercel production and preview URLs to the allowed redirect URLs if you use preview deployments.
5. When you change environment variables, redeploy so the new values are applied.

The app can be previewed without Supabase, but placing orders, tracking, review submissions, and admin sign-in require the database setup above. Replace the sample invitation images, prices, studio contact details, and social links with your own before launch.
