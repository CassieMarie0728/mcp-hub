# GitHub Pages Setup Automation

Two automated setup scripts to configure GitHub Pages for the MCP Hub landing page in seconds.

## Quick Start

### Option 1: Node.js Script (Recommended - Cross-Platform)

```bash
npm run setup:github-pages
```

Or with options:

```bash
npm run setup:github-pages -- --custom-domain mcphub.io
```

### Option 2: Bash Script

```bash
bash scripts/setup-github-pages.sh
```

Or with options:

```bash
./scripts/setup-github-pages.sh --custom-domain mcphub.io
```

## What Gets Automated

✅ Checks GitHub CLI is installed and authenticated  
✅ Auto-detects repository from git remote  
✅ Enables GitHub Pages with GitHub Actions as source  
✅ Configures workflow permissions  
✅ Sets custom domain (optional)  
✅ Verifies setup completion  
✅ Checks workflow status  

## Prerequisites

- **GitHub CLI** (`gh`) - [Install here](https://cli.github.com)
- **Git** - [Install here](https://git-scm.com)
- Repository pushed to GitHub
- Write access to the repository

### Authenticate GitHub CLI

```bash
gh auth login
# Follow the prompts to authenticate
```

## Available Scripts

### Node.js Version (Recommended)

**File**: `scripts/setup-github-pages.js`

**Advantages**:
- Cross-platform (Windows, macOS, Linux)
- Integrated with npm
- Better error handling
- Easier to debug

**Usage**:

```bash
# Basic setup
npm run setup:github-pages

# With custom domain
npm run setup:github-pages -- --custom-domain mcphub.io

# Specify repository explicitly
npm run setup:github-pages -- --repo cassandra/mcp-hub

# View help
node scripts/setup-github-pages.js --help
```

### Bash Version

**File**: `scripts/setup-github-pages.sh`

**Advantages**:
- Lightweight
- No Node.js required
- Traditional shell script

**Usage**:

```bash
# Basic setup
./scripts/setup-github-pages.sh

# With custom domain
./scripts/setup-github-pages.sh --custom-domain mcphub.io

# Specify repository explicitly
./scripts/setup-github-pages.sh --repo cassandra/mcp-hub

# View help
./scripts/setup-github-pages.sh --help
```

## Command Line Options

### `--repo OWNER/REPO`

Explicitly specify the GitHub repository.

```bash
npm run setup:github-pages -- --repo cassandra/mcp-hub
```

If not provided, the script auto-detects from git remote.

### `--custom-domain DOMAIN`

Configure a custom domain for your landing page.

```bash
npm run setup:github-pages -- --custom-domain mcphub.io
```

The script will:
1. Configure the domain in GitHub Pages
2. Display DNS configuration instructions
3. Explain how to update your domain's DNS records

### `--help`

Display help and usage information.

```bash
npm run setup:github-pages -- --help
```

## Example Output

```
╔═══════════════════════════════════════════════════════════╗
║     GitHub Pages Setup Automation Script                  ║
║     MCP Hub Landing Page Deployment                       ║
╚═══════════════════════════════════════════════════════════╝

ℹ Checking prerequisites...
✓ GitHub CLI found
✓ GitHub CLI authenticated
✓ Git found
ℹ Detecting repository from git remote...
✓ Repository: cassandra/mcp-hub
ℹ Enabling GitHub Pages...
✓ GitHub Pages enabled with GitHub Actions
ℹ Configuring workflow permissions...
✓ Workflow permissions configured
ℹ Verifying GitHub Pages setup...
✓ GitHub Pages Status: built
✓ Landing page URL: https://cassandra.github.io/mcp-hub/
ℹ Checking workflow status...
✓ Latest workflow run: completed (success)
ℹ View workflow: https://github.com/cassandra/mcp-hub/actions/runs/12345

═══════════════════════════════════════════════════════════
GitHub Pages Setup Complete!
═══════════════════════════════════════════════════════════

Repository: cassandra/mcp-hub
Workflow: .github/workflows/deploy-landing-page.yml
Landing page directory: landing/

Next steps:
  1. Commit and push changes to main branch
  2. Go to: https://github.com/cassandra/mcp-hub/actions
  3. Monitor the 'Deploy Landing Page to GitHub Pages' workflow
  4. Your landing page will be available at the GitHub Pages URL
```

## Troubleshooting

### "GitHub CLI is not authenticated"

```bash
gh auth login
# Follow the interactive prompts
```

### "Could not detect repository from git remote"

Ensure you're in the project directory with a git remote:

```bash
cd /home/ubuntu/mcp-hub
git remote -v  # Should show origin pointing to GitHub
```

If not configured:

```bash
git remote add origin https://github.com/YOUR_USERNAME/mcp-hub.git
```

### "GitHub Pages not yet configured"

This is normal on first run. The script will configure it automatically.

### Workflow not triggering

1. Verify workflow file exists: `.github/workflows/deploy-landing-page.yml`
2. Push changes to `landing/` directory on `main` branch
3. Check **Actions** tab in GitHub

### Custom domain not working

1. Verify DNS records are configured correctly
2. Wait 5-10 minutes for DNS propagation
3. Check GitHub Pages settings in repository

## Manual Setup (If Scripts Don't Work)

If you prefer to set up GitHub Pages manually:

1. Go to repository **Settings** → **Pages**
2. Select "GitHub Actions" as source
3. Go to **Settings** → **Actions** → **General**
4. Enable "Read and write permissions"
5. Push changes to trigger deployment

## What Happens Next

After running the setup script:

1. **Workflow Triggers** - Any push to `landing/` directory on `main` branch triggers deployment
2. **Deployment Starts** - GitHub Actions runs `.github/workflows/deploy-landing-page.yml`
3. **Pages Built** - Landing page files are uploaded to GitHub Pages
4. **Live** - Your landing page is available at `https://<username>.github.io/mcp-hub/`

## Accessing Your Landing Page

After deployment:

```
https://<username>.github.io/mcp-hub/
```

For example:
- Landing page: `https://cassandra.github.io/mcp-hub/`
- Workflow builder demo: `https://cassandra.github.io/mcp-hub/demo-workflow-builder.html`
- Execution simulator: `https://cassandra.github.io/mcp-hub/demo-execution-simulator.html`
- Features showcase: `https://cassandra.github.io/mcp-hub/demo-features.html`

## Custom Domain Setup

To use a custom domain like `mcphub.io`:

### 1. Run Setup Script with Domain

```bash
npm run setup:github-pages -- --custom-domain mcphub.io
```

### 2. Update DNS Records

The script will display your DNS configuration instructions. Typically:

**A Records** (point to GitHub's servers):
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**CNAME Record** (alternative):
```
<username>.github.io
```

### 3. Wait for Propagation

DNS changes can take 5-10 minutes to propagate. GitHub will automatically provision an SSL certificate.

## Monitoring Deployments

1. Go to **Actions** tab in your GitHub repository
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

## Performance

- First deployment: 1-2 minutes
- Subsequent deployments: 30-60 seconds
- Landing page served via CDN with caching
- SSL/TLS automatically enabled

## Security

- All files are public (GitHub Pages is public by default)
- No sensitive information in landing page files
- SSL/TLS automatically enabled by GitHub
- Consider using environment variables for dynamic content

## Integration with CI/CD

Run the setup script in your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Setup GitHub Pages
  run: npm run setup:github-pages
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Support

For issues with:

- **GitHub CLI**: https://github.com/cli/cli/issues
- **GitHub Pages**: https://docs.github.com/en/pages
- **This script**: Review the troubleshooting section above

## Next Steps

1. ✅ Run the setup script: `npm run setup:github-pages`
2. ✅ Verify GitHub Pages is enabled
3. ✅ Push changes to trigger deployment
4. ✅ Access your landing page
5. ✅ (Optional) Configure custom domain

## Related Documentation

- [GitHub Pages Deployment Guide](./GITHUB_PAGES_DEPLOYMENT.md)
- [GitHub Pages Setup Script Guide](./GITHUB_PAGES_SETUP_SCRIPT.md)
- [Landing Page Documentation](../landing/README.md)

## Version History

- **v1.0.0** - Initial release with Node.js and Bash scripts
