# GitHub Pages Deployment Guide

## Overview

The landing page is automatically deployed to GitHub Pages whenever changes are pushed to the `landing/` directory on the `main` branch.

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"
   - **Branch**: Should auto-detect `main`
4. Click **Save**

### 2. Verify Workflow Permissions

1. Go to **Settings** → **Actions** → **General**
2. Under "Workflow permissions":
   - ✅ Enable "Read and write permissions"
   - ✅ Enable "Allow GitHub Actions to create and approve pull requests"
3. Click **Save**

### 3. Deploy

The workflow will automatically trigger when:

- Changes are pushed to `landing/` directory on `main` branch
- The workflow file itself is modified
- You manually trigger it via "Run workflow"

## Workflow Details

**File**: `.github/workflows/deploy-landing-page.yml`

**Triggers**:

- Push to `main` with changes in `landing/**` or `.github/workflows/deploy-landing-page.yml`
- Manual dispatch via GitHub Actions UI

**Steps**:

1. Checkout repository code
2. Configure GitHub Pages environment
3. Upload `landing/` directory as artifact
4. Deploy to GitHub Pages

**Permissions Required**:

- `contents: read` - Read repository contents
- `pages: write` - Write to GitHub Pages
- `id-token: write` - OIDC token for deployment

## Landing Page Structure

```
landing/
├── index.html                      # Main landing page
├── demo-workflow-builder.html      # Workflow builder demo
├── demo-execution-simulator.html   # Execution simulator demo
└── demo-features.html              # Features showcase demo
```

## Accessing Your Landing Page

After deployment, your landing page will be available at:

```
https://<username>.github.io/<repository>/
```

For example:

- If your GitHub username is `cassandra` and repo is `mcp-hub`:
  - Landing page: `https://cassandra.github.io/mcp-hub/`
  - Demos:
    - `https://cassandra.github.io/mcp-hub/demo-workflow-builder.html`
    - `https://cassandra.github.io/mcp-hub/demo-execution-simulator.html`
    - `https://cassandra.github.io/mcp-hub/demo-features.html`

## Custom Domain (Optional)

To use a custom domain like `mcphub.io`:

1. Go to **Settings** → **Pages**
2. Under "Custom domain", enter your domain (e.g., `mcphub.io`)
3. Update your domain's DNS records to point to GitHub Pages:
   - **A records**: Point to GitHub's IP addresses
   - **CNAME record**: Point to `<username>.github.io`
4. GitHub will automatically provision an SSL certificate

See [GitHub's custom domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) for detailed instructions.

## Troubleshooting

### Workflow Not Triggering

- Verify `main` branch is your default branch
- Check that changes are in `landing/` directory
- Manually trigger via **Actions** → **Deploy Landing Page to GitHub Pages** → **Run workflow**

### Pages Not Updating

- Check **Actions** tab for workflow status
- Look for any error messages in the workflow run logs
- Verify GitHub Pages is enabled in **Settings** → **Pages**

### SSL Certificate Issues

- Wait 5-10 minutes for GitHub to provision the certificate
- Try clearing browser cache
- Check HTTPS is enabled in **Settings** → **Pages**

## Monitoring Deployments

1. Go to **Actions** tab in your repository
2. Select **Deploy Landing Page to GitHub Pages** workflow
3. View deployment history and logs

Each deployment shows:

- Commit hash and message
- Deployment status (success/failure)
- Deployment URL
- Execution time

## Rollback

To rollback to a previous version:

1. Revert the commit that broke the landing page
2. Push to `main`
3. The workflow will automatically redeploy the previous version

## Performance Notes

- GitHub Pages serves static files with CDN caching
- First deployment may take 1-2 minutes
- Subsequent deployments are typically faster
- Landing page will be cached by browsers and CDN

## Security

- All files are public (GitHub Pages is public by default)
- No sensitive information should be in landing page files
- Consider using environment variables for any dynamic content
- SSL/TLS is automatically enabled by GitHub

## Next Steps

1. ✅ Workflow file created
2. ⏳ Enable GitHub Pages in repository settings
3. ⏳ Verify workflow permissions
4. ⏳ Push changes to trigger first deployment
5. ⏳ Access your landing page at `https://<username>.github.io/<repo>/`
