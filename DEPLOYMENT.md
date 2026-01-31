# Deployment Guide

## Related Documentation

- **[README.md](README.md)** - Main project guide and data collection workflow
- **[AGENTS.md](AGENTS.md)** - Developer guide and code style
- **[WEB_APP_COMPLETION.md](WEB_APP_COMPLETION.md)** - Web app implementation report
- **[data/DATA_SUMMARY.md](data/DATA_SUMMARY.md)** - Data collection statistics
- **[web/README.md](web/README.md)** - Web app development and build commands

---

## Prerequisites

- Git repository initialized
- GitHub repository created
- Node.js and npm installed locally

## Automatic Deployment with GitHub Actions

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under "Build and deployment":
   - Source: **GitHub Actions**

### 2. Push Your Code

```bash
# Initialize git (if not already done)
git init

# Add files
git add .
git commit -m "Initial commit: EndField Build Sim web app"

# Add remote (replace with your repository)
git remote add origin git@github.com:yourusername/EndFieldBuildSim.git

# Push to main branch
git push -u origin main
```

### 3. Automatic Deployment

- GitHub Actions will automatically trigger on push to `main`
- View progress: **Actions** tab in your repository
- Deployment takes ~2-3 minutes
- Once complete, visit: `https://yourusername.github.io/EndFieldBuildSim/`

### 4. Verify Deployment

- Check Actions tab for green checkmark ✅
- Visit the deployed URL
- Test search functionality
- Click an item to verify detail page loads
- Check that synthesis tables appear for items that have them

## Manual Deployment (Alternative)

If you prefer manual deployment or GitHub Actions isn't available:

```bash
# Build the project
cd web
npm install
npm run build

# Deploy to gh-pages branch
cd dist
git init
git add -A
git commit -m "Deploy to GitHub Pages"
git branch -M gh-pages
git remote add origin git@github.com:yourusername/EndFieldBuildSim.git
git push -f origin gh-pages
```

Then in GitHub repository settings:
- Settings → Pages
- Source: **Deploy from a branch**
- Branch: **gh-pages** / (root)

## Troubleshooting

### Blank Page After Deployment

**Problem**: Page loads but shows blank screen  
**Solution**: Check browser console for errors. Verify `base: '/EndFieldBuildSim/'` in `web/vite.config.ts` matches your repository name.

### 404 on Refresh

**Problem**: Page works initially but refreshes give 404  
**Solution**: This is expected with HashRouter. URLs use `#` (e.g., `#/item/193`), which works correctly.

### Images Not Loading

**Problem**: Item images show placeholder  
**Solution**: Images are loaded from external CDN (bbs.hycdn.cn). Check network connection and CORS settings.

### Build Fails

**Problem**: GitHub Actions build fails  
**Solution**: 
1. Check Actions tab for error logs
2. Verify `package.json` and `package-lock.json` are committed
3. Ensure `web/public/data/` contains all data files

## Configuration

### Change Repository Name

If your repository name is different from "EndFieldBuildSim":

1. Update `web/vite.config.ts`:
   ```ts
   export default defineConfig({
     plugins: [react()],
     base: '/YourRepoName/',  // Change this
   })
   ```

2. Update `.github/workflows/deploy.yml` if needed (usually auto-detects)

### Custom Domain

To use a custom domain:

1. Add `CNAME` file to `web/public/`:
   ```
   yourdomain.com
   ```

2. Update `web/vite.config.ts`:
   ```ts
   export default defineConfig({
     plugins: [react()],
     base: '/',  // Root path for custom domain
   })
   ```

3. Configure DNS settings with your domain provider

## Local Testing

Test the production build locally before deploying:

```bash
cd web
npm run build
npm run preview
```

Visit http://localhost:4173/ to test the built version.

## Continuous Deployment

The workflow triggers automatically on:
- Push to `main` branch
- Manual workflow dispatch (Actions tab → "Deploy to GitHub Pages" → Run workflow)

To disable automatic deployment:
- Remove or comment out the `push:` section in `.github/workflows/deploy.yml`
- Use manual dispatch only

## Data Updates

To update the item data:

1. Run data collection scripts in `data/` directory
2. Copy updated files to `web/public/data/`
3. Commit and push changes
4. GitHub Actions will automatically redeploy

```bash
# Update data
python data/fetch_details_browser.py
python data/extract_synthesis_tables.py

# Copy to web app
cp data/item_lookup.json web/public/data/
cp -r data/item_details web/public/data/
cp -r data/synthesis_tables web/public/data/

# Deploy
git add .
git commit -m "Update item data"
git push
```
