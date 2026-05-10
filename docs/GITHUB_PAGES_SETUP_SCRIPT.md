# GitHub Pages Setup Script

Automated setup script that configures GitHub Pages for the MCP Hub landing page in seconds.

## Prerequisites

- **GitHub CLI** (`gh`) installed and authenticated
- **Git** installed
- Repository pushed to GitHub
- Write access to the repository

### Install GitHub CLI

```bash
# macOS
brew install gh

# Ubuntu/Debian
sudo apt-get install gh

# Or download from: https://cli.github.com
```

### Authenticate GitHub CLI

```bash
gh auth login
# Follow the prompts to authenticate
```

## Usage

### Basic Setup

```bash
./scripts/setup-github-pages.sh
```

The script will:
1. ✅ Auto-detect your repository from git remote
2. ✅ Enable GitHub Pages
3. ✅ Configure workflow permissions
4. ✅ Verify the setup
5. ✅ Check workflow status

### With Custom Domain

```bash
./scripts/setup-github-pages.sh --custom-domain mcphub.io
```

### Specify Repository Explicitly

```bash
./scripts/setup-github-pages.sh --repo cassandra/mcp-hub
```

### View Help

```bash
./scripts/setup-github-pages.sh --help
```

## What the Script Does

### 1. Checks Prerequisites
- Verifies `gh` CLI is installed
- Confirms `gh` is authenticated
- Checks for git installation

### 2. Detects Repository
- Parses git remote URL
- Extracts OWNER/REPO
- Validates repository access

### 3. Enables GitHub Pages
- Configures GitHub Pages with GitHub Actions as source
- Sets main branch as deployment source
- Enables automatic deployments

### 4. Configures Workflow Permissions
- Sets workflow default permissions to "write"
- Allows workflows to create and approve PRs
- Enables necessary repository access

### 5. Sets Custom Domain (Optional)
- Configures custom domain if provided
- Displays DNS configuration instructions
- Validates domain setup

### 6. Verifies Setup
- Checks GitHub Pages status
- Displays landing page URL
- Shows custom domain (if configured)

### 7. Checks Workflow Status
- Retrieves latest workflow run
- Shows deployment status
- Provides workflow URL for monitoring

## Output Example

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

Ensure you're in the project directory and have a git remote configured:

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

1. Verify the workflow file exists: `.github/workflows/deploy-landing-page.yml`
2. Push changes to `landing/` directory on `main` branch
3. Check **Actions** tab in GitHub for workflow status

### Custom domain not working

1. Verify DNS records are configured correctly
2. Wait 5-10 minutes for DNS propagation
3. Check GitHub Pages settings in repository

## Manual Alternative

If you prefer to set up GitHub Pages manually:

1. Go to repository **Settings** → **Pages**
2. Select "GitHub Actions" as source
3. Go to **Settings** → **Actions** → **General**
4. Enable "Read and write permissions"
5. Push changes to trigger deployment

## Script Details

**Location**: `scripts/setup-github-pages.sh`

**Language**: Bash

**Dependencies**:
- `gh` (GitHub CLI)
- `git`
- `jq` (for JSON parsing)
- Standard Unix utilities

**Size**: ~8.3 KB

**Execution Time**: 30-60 seconds

## Advanced Options

### Dry Run (View What Would Happen)

```bash
# Add --dry-run flag (if implemented)
./scripts/setup-github-pages.sh --dry-run
```

### Verbose Output

```bash
# Add --verbose flag (if implemented)
./scripts/setup-github-pages.sh --verbose
```

## Integration with CI/CD

You can run this script in your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Setup GitHub Pages
  run: ./scripts/setup-github-pages.sh
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Security Notes

- The script uses GitHub CLI's authenticated session
- No credentials are stored in the script
- All API calls are made through official GitHub CLI
- Permissions are scoped to the repository

## Support

For issues with:

- **GitHub CLI**: https://github.com/cli/cli/issues
- **GitHub Pages**: https://docs.github.com/en/pages
- **This script**: Check the troubleshooting section above

## Next Steps

1. ✅ Run the setup script
2. ✅ Verify GitHub Pages is enabled
3. ✅ Push changes to trigger deployment
4. ✅ Access your landing page
5. ✅ (Optional) Configure custom domain
