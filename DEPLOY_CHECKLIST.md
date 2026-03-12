# 🚀 MAC Deployment Checklist

## Step 1: Database Setup (Supabase)

Run these SQL scripts **in order** in your Supabase SQL Editor:

### 1.1 Fix RLS Policies
```sql
-- Copy and paste from: fix_rls_recursion.sql
-- This creates the secure is_admin() function
```

### 1.2 Auto-Create User Profiles
```sql
-- Copy and paste from: supabase_triggers.sql
-- This ensures every new user gets a profile automatically
```

### 1.3 Event Registrations Table
```sql
-- Copy and paste from: registrations.sql
-- This creates the registrations table with RLS policies
```

### 1.4 Access Requests Table
```sql
-- Copy and paste from: access_requests.sql
-- This creates the invite request system
```

---

## Step 2: Deploy to Netlify

### 2.1 Connect Repository
1. Go to [Netlify](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Select **GitHub** and authorize
4. Choose your **MAC** repository

### 2.2 Build Settings
- **Build command:** (leave blank)
- **Publish directory:** `.` (or leave as detected)
- Your `netlify.toml` handles this automatically

### 2.3 ⚠️ CRITICAL: Environment Variables

Go to **Site settings** → **Environment variables** and add:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | `https://azmfbhffgqqeqbxmkdqf.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bWZiaGZmZ3FxZXFieG1rZHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTc1NjksImV4cCI6MjA4NjIzMzU2OX0.74VBnyYMCfgOH5IQvj1c1-O2GCQTG6ul5bXRgTizJWU` |
| `RESEND_API_KEY` | **re_bQeF7X6L_2SXVCjnNFxFjkmqKAUdbnkoh** (Set in Supabase Edge Functions) |
| `SENDER_EMAIL` | `onboarding@resend.dev` (Matches Resend sender) |
| `ADMIN_EMAIL` | `hridesh.775421@pmc.tu.edu.np` (Admin recipient) |

> **Note:** Payment logic has been replaced with an email flow. Ensure these secrets are set in your Supabase project (Authentication/Edge Functions).

### 2.4 Deploy
Click **"Deploy site"** and wait ~1 minute.

---

## Step 3: Security Configuration

### 3.1 Disable Public Signups
1. Go to Supabase Dashboard → **Authentication** → **Providers** → **Email**
2. **Uncheck** "Enable Signups"
3. Click **Save**

This ensures only admins can create users (invite-only).

---

## Step 4: Verification

### 4.1 Test Login
- Visit your Netlify URL
- Try logging in with your admin credentials
- Verify the Admin Dashboard loads

### 4.2 Test Access Request
- Click "Request an Invitation" on the login screen
- Submit an email
- Check the "Requests" tab in Admin Dashboard

### 4.3 Test Event Registration
- Log in as a member
- Register for an event
- Verify it appears in "My Events"

---

## 🎉 You're Live!

Your site should now be fully functional at your Netlify URL.

**Need the SERVICE_ROLE_KEY?**
1. Go to Supabase Dashboard
2. Settings → API
3. Copy the **service_role** secret key
4. Add it to Netlify environment variables
5. Redeploy if needed
