# Deploying to Vercel

This guide will help you deploy the Global Shapers Faisalabad Hub website to Vercel.

## Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Prepare your project:**
   - Make sure all files are ready
   - Ensure images are in the `images/` folder
   - All HTML files are in the root directory

2. **Go to Vercel:**
   - Visit [vercel.com](https://vercel.com)
   - Sign up or log in

3. **Deploy:**
   - Click "New Project"
   - Import your Git repository OR
   - Use "Deploy" and drag/drop your project folder

## Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from project directory:**
   ```bash
   cd "/Users/talalmuzaffar/Desktop/Global Shaper - Website"
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy: Yes
   - Which scope: Your account
   - Link to existing project: No
   - Project name: global-shapers-faisalabad
   - Directory: ./
   - Override settings: No

5. **Production deployment:**
   ```bash
   vercel --prod
   ```

## Option 3: Deploy via GitHub

1. **Initialize Git (if not already):**
   ```bash
   cd "/Users/talalmuzaffar/Desktop/Global Shaper - Website"
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create GitHub repository:**
   - Go to GitHub and create a new repository
   - Push your code:
   ```bash
   git remote add origin YOUR_GITHUB_REPO_URL
   git branch -M main
   git push -u origin main
   ```

3. **Connect to Vercel:**
   - Go to Vercel dashboard
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect settings
   - Click "Deploy"

## Configuration Files Created

- `vercel.json` - Vercel configuration for routing
- `package.json` - Project metadata (optional for static sites)
- `.vercelignore` - Files to exclude from deployment

## Important Notes

1. **Images:** Make sure all banner images exist:
   - `images/banner-about.jpg`
   - `images/banner-projects.jpg`
   - `images/banner-team.jpg`
   - `images/banner-contact.jpg`

2. **Custom Domain:** After deployment, you can add a custom domain in Vercel settings

3. **Environment Variables:** Not needed for this static site, but can be added in Vercel dashboard if required in future

4. **Automatic Deployments:** If connected to GitHub, Vercel will automatically deploy on every push to main branch

## Troubleshooting

- **404 Errors:** Make sure `vercel.json` is configured correctly
- **Missing Images:** Check image paths in CSS and HTML files
- **Build Errors:** Static HTML sites shouldn't have build errors, but check console for any issues

## Next Steps After Deployment

1. Update any hardcoded URLs if needed
2. Test all pages and links
3. Set up custom domain (optional)
4. Enable analytics in Vercel dashboard (optional)

