# FC2X Setup Guide

This guide will help you complete the setup of the FC2X application.

## ✅ Completed Steps

1. ✅ Project files copied to workspace
2. ✅ Environment variables file created (`.env.local`)
3. ✅ Dependencies installed
4. ✅ Constants updated with your webhook URL

## 🔧 Remaining Configuration Steps

### 1. Set Up Neon Database

1. Log into your [Neon Console](https://console.neon.tech)
2. Create a new project (or use an existing one)
3. Copy the connection string (it should look like: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`)
4. Update `.env.local` and replace the `POSTGRES_URL` placeholder with your actual connection string
5. Run the database migration:
   - Option A: Use Neon's SQL Editor
     - Go to your Neon project dashboard
     - Open the SQL Editor
     - Copy and paste the contents of `setup-db.sql`
     - Execute the query
   - Option B: Use psql command line
     ```bash
     psql "your-postgres-connection-string" -f setup-db.sql
     ```

### 2. Set Up Twitter/X API Credentials

1. Go to the [Twitter/X Developer Portal](https://developer.x.com/en/portal)
2. Create a new app or use an existing one
3. Get your **API Key** and **API Key Secret** (these are your `TWITTER_CONSUMER_KEY` and `TWITTER_CONSUMER_SECRET`)
4. Set the **Callback URL** in your Twitter app settings to: `https://neynar-reposter.vercel.app/api/callback`
5. Update `.env.local` with:
   - `TWITTER_CONSUMER_KEY` - Your Twitter API Key
   - `TWITTER_CONSUMER_SECRET` - Your Twitter API Key Secret
   - `TWITTER_CALLBACK_URL` - Already set to your webhook URL base + `/api/callback`

### 3. Verify Environment Variables

Your `.env.local` should have all these variables set:

```env
# Neynar (✅ Already configured)
NEYNAR_API_KEY=61C7E6E2-571A-485D-B00C-D6154F3BF509
NEXT_PUBLIC_NEYNAR_CLIENT_ID=e82e6353-c7a7-4b6c-bcf9-e7aadf1576d1
NEYNAR_WEBHOOK_ID=01KDQK22FMQDKWMMFNKJEHTP3G
NEYNAR_WEBHOOK_SECRET=sQWuONqsU1sf3nZnWVCRiwQwI
NEXT_PUBLIC_VERCEL_URL=https://neynar-reposter.vercel.app

# Database (⚠️ Needs your Neon connection string)
POSTGRES_URL=your-neon-connection-string-here

# Twitter (⚠️ Needs your Twitter API credentials)
TWITTER_CONSUMER_KEY=your_twitter_consumer_key_here
TWITTER_CONSUMER_SECRET=your_twitter_consumer_secret_here
TWITTER_CALLBACK_URL=https://neynar-reposter.vercel.app/api/callback
```

## 🚀 Running the Application

### Development Mode

```bash
yarn dev
```

The app will be available at `http://localhost:3000`

### Production Build

```bash
yarn build
yarn start
```

## 📝 How It Works

1. Users authenticate with Farcaster using Neynar
2. Users link their Twitter/X account via OAuth
3. When a user creates a cast on Farcaster, the webhook receives the event
4. The app cross-posts the cast to Twitter/X automatically

## 🔍 Testing

1. Start the dev server: `yarn dev`
2. Visit `http://localhost:3000`
3. Sign in with Farcaster
4. Link your Twitter account
5. Create a cast on Farcaster
6. Check your Twitter account - the cast should be cross-posted!

## 📚 Additional Resources

- [Neynar Documentation](https://docs.neynar.com)
- [Twitter API Documentation](https://developer.x.com/en/docs)
- [Neon Documentation](https://neon.tech/docs)



