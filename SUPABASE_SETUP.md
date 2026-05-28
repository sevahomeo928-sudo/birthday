# 🚀 Supabase Realtime Setup Guide - Netlify Compatible

This guide replaces your WebSocket-based sync with **Supabase Realtime**, which works perfectly on Netlify and other serverless platforms.

## ✨ What Changed?

- ❌ **Removed**: Custom Node.js WebSocket server (`/ws` endpoint)
- ✅ **Added**: Supabase Realtime (serverless, no backend needed)
- ✅ **Same functionality**: Instant global sync across all users
- ✅ **Netlify compatible**: Works on all static hosting platforms
- ✅ **Free tier**: Supabase Free plan supports unlimited realtime connections

---

## 📋 Step 1: Get Supabase Credentials (5 minutes)

### 1.1 Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** → Sign up / Log in
3. Click **"New Project"**
4. Fill in:
   - **Name**: `birthday-app` (or any name)
   - **Password**: Create a strong password (save it)
   - **Region**: Select closest to your users
5. Click **"Create new project"** (wait 2-3 minutes for setup)

### 1.2 Get Your API Keys
1. Once the project loads, go to **Settings → API**
2. You'll see:
   - **Project URL** (copy this)
   - **Publishable Key (anon)** under "Project API keys" (copy this)

**Example:**
```
Publishable key: sb_publishable_h-ty7lSa8ZMgLcN9xmsRJg_x7S46...
```

### 1.3 Update `.env.local`
Open `.env.local` in your project and replace:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_h-ty7lSa8ZMgLcN9xmsRJg_x7S46...
```

---

## 💻 Step 2: Install Dependencies

```bash
npm install
```

(Supabase package already added to `package.json`)

---

## 🧪 Step 3: Test It Works

### Test 1: Single Device
```bash
npm run dev
```
1. Open `http://localhost:3000` in browser
2. Tap footer 5 times to open Admin Panel
3. Login: `mag85158` / `magadmin`
4. Change name to "Test User"
5. Click **"Deploy Changes"**
6. Look at browser console - you should see: `📤 Broadcasted person update`

### Test 2: Multiple Devices (Real Sync)
1. Open `http://localhost:3000` on **Device A**
2. Open `http://localhost:3000` on **Device B**
3. On **Device A**: Open Admin, login, change name
4. Click **"Deploy Changes"** on Device A
5. **Device B** should see the change instantly! ✨

### Connection Status
Look at top-right of Admin Panel:
- 🟢 **Live Sync** = Connected to Supabase
- 🟡 **Offline Mode** = No connection (still works with local sync)

---

## 🚀 Step 4: Deploy to Netlify

### 4.1 Push to GitHub
```bash
git add .
git commit -m "Add Supabase Realtime sync for Netlify"
git push origin supabase-realtime-sync
```

### 4.2 Set Environment Variables in Netlify
1. Go to [Netlify.com](https://netlify.com) → Your site
2. **Site Settings → Build & deploy → Environment**
3. Click **"Edit variables"**
4. Add both variables:
   ```
   VITE_SUPABASE_URL = https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY = sb_publishable_h-ty7lSa8ZMgLcN9xmsRJg_x7S46...
   ```
5. Save and deploy

---

## 🐛 Troubleshooting

### "Supabase credentials not found"
- Check `.env.local` has both variables
- Restart dev server: `npm run dev`
- Reload browser

### Updates not syncing across devices
- Both devices must have same `VITE_SUPABASE_ANON_KEY`
- Check browser console (F12 → Console) for errors
- Look for "✅ Real-time sync connected" message

### "Failed to broadcast via Supabase"
- Check Supabase project is running
- Wait 2-3 seconds and retry
- Verify `VITE_SUPABASE_URL` ends with `.supabase.co`

---

## 📁 Files Changed

```
NEW FILES:
- src/lib/supabaseRealtimeSync.ts
- .env.local
- SUPABASE_SETUP.md

UPDATED:
- package.json (added @supabase/supabase-js)
- src/lib/globalStateManager.ts (now uses Supabase)

NO LONGER USED:
- src/lib/realtimeSync.ts (old WebSocket manager)
```

---

## ✅ You're Done!

Your app now:
- ✅ Works on Netlify (no custom server needed)
- ✅ Syncs instantly when Admin deploys
- ✅ Free tier (no monthly costs)
- ✅ Scales to thousands of users

**Next:** Merge the `supabase-realtime-sync` branch to main and deploy to Netlify! 🎉
