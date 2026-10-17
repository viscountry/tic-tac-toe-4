# 🚀 Deployment Guide for Tic-Tac-Four

## Quick Start

Your project is now **ready to deploy to Render!** Everything is configured and tested.

## Step-by-Step Deployment

### 1. Push to GitHub

First, initialize git and push your code:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Tic-Tac-Four ready for deployment"

# Rename branch to main
git branch -M main

# Add your GitHub repository (replace with your actual repo URL)
git remote add origin https://github.com/YOUR_USERNAME/tic-tac-four.git

# Push to GitHub
git push -u origin main
```

### 2. Deploy on Render

#### Option A: Using Render Blueprint (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New → Blueprint**
3. Connect your GitHub account if you haven't
4. Select your `tic-tac-four` repository
5. Render automatically reads `render.yaml`
6. Click **Apply**
7. Wait 2-3 minutes for the build to complete

#### Option B: Manual Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New → Web Service**
3. Connect your GitHub repository
4. Configure the service:
   - **Name:** `tic-tac-four` (or your preferred name)
   - **Environment:** `Node`
   - **Build Command:** `npm install --include=dev && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free (or your preferred plan)
5. Click **Create Web Service**
6. Wait for deployment to complete

### 3. Test Your Deployment

Once deployed, Render will give you a URL like:
```
https://tic-tac-four-xyz.onrender.com
```

Test these features:
- ✅ Homepage loads correctly
- ✅ Play the robot (both Easy and Hard modes)
- ✅ Create a room and get a room code
- ✅ Open the site in another browser tab and join with the code
- ✅ Play a full game online
- ✅ Test the rematch feature

## Important Notes

### Free Tier Limitations
- **Sleep after inactivity:** Render's free tier sleeps after 15 minutes of inactivity
- **First visit:** May take 30-50 seconds to wake up
- **No persistence:** Restarting the server deletes all rooms (this is by design)

### Keeping Your App Awake (Optional)
If you want to prevent sleep, consider:
- Upgrading to a paid plan ($7/month keeps it always on)
- Using a service like [UptimeRobot](https://uptimerobot.com/) to ping your app every 5 minutes

### Environment Variables
No environment variables are required! The app works out of the box.

### Custom Domain (Optional)
To use a custom domain:
1. Go to your Render service settings
2. Click **Add Custom Domain**
3. Follow Render's instructions to update your DNS

## Project Structure

```
tic-tac-four/
├── index.html              # Vite entry point
├── vite.config.js          # React + Tailwind config
├── render.yaml             # Render deployment config
├── package.json            # Dependencies and scripts
├── .gitignore              # Git ignore rules
├── server/
│   └── index.js            # Express + WebSocket server
└── src/
    ├── main.jsx            # React entry
    ├── App.jsx             # Main router
    ├── index.css           # Tailwind + theme
    ├── shared/game.js      # Game rules + AI
    ├── hooks/              # Custom React hooks
    ├── screens/            # Page components
    └── components/         # Reusable UI components
```

## Troubleshooting

### Build Fails on Render
- Check that `package.json` is in the root directory
- Verify Node version: Render uses Node 20+ (specified in `render.yaml`)
- Check build logs in Render dashboard for specific errors

### WebSocket Connection Issues
- Render automatically handles WebSocket connections
- The code automatically uses `wss://` on HTTPS and `ws://` on HTTP
- No additional configuration needed

### Game Rooms Not Working
- Rooms are stored in memory, so they reset when the server restarts
- Check that both players are on the same deployed URL
- Verify WebSocket connection in browser dev tools (Network tab)

## Local Development

To run locally before deploying:

```bash
# Install dependencies
npm install

# Start development server (runs both frontend and backend)
npm run dev

# Open http://localhost:5173
# Backend runs on http://localhost:3000
```

To test the production build locally:

```bash
# Build the app
npm run build

# Start production server
npm start

# Open http://localhost:3000
```

## Getting Help

If you encounter issues:
1. Check Render's build logs in the dashboard
2. Verify all files are committed to GitHub
3. Make sure Node version is 20+ in `render.yaml`
4. Check that `render.yaml` is in the root directory

## Next Steps

After successful deployment:
- Share your game URL with friends!
- Consider adding a custom domain
- Monitor usage in Render dashboard
- Add features (see README.md "Where to change things" section)

---

**You're all set!** 🎉 Your Tic-Tac-Four game is ready to deploy.
