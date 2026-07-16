#!/usr/bin/env node

/**
 * GitHub Pages Setup Automation Script (Node.js Version)
 *
 * This script automates the setup of GitHub Pages for the MCP Hub landing page.
 * It requires GitHub CLI (gh) to be installed and authenticated.
 *
 * Usage:
 *   node scripts/setup-github-pages.js [options]
 *   npm run setup:github-pages [options]
 *
 * Options:
 *   --repo OWNER/REPO         GitHub repository (default: auto-detect from git remote)
 *   --custom-domain DOMAIN    Set custom domain (optional)
 *   --help                    Show this help message
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Configuration
let config = {
  repo: '',
  customDomain: '',
  projectRoot: path.resolve(__dirname, '..'),
};

/**
 * Logger functions
 */
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}✗${colors.reset} ${msg}`),
};

/**
 * Execute shell command and return output
 */
function exec(cmd, options = {}) {
  try {
    const result = execSync(cmd, {
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
    return result.trim();
  } catch (error) {
    if (options.throwError !== false) {
      throw error;
    }
    return null;
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--repo':
        config.repo = args[++i];
        break;
      case '--custom-domain':
        config.customDomain = args[++i];
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
      default:
        log.error(`Unknown option: ${args[i]}`);
        printHelp();
        process.exit(1);
    }
  }
}

/**
 * Print help message
 */
function printHelp() {
  const help = `
GitHub Pages Setup Automation Script

Usage:
  node scripts/setup-github-pages.js [options]
  npm run setup:github-pages [options]

Options:
  --repo OWNER/REPO         GitHub repository (default: auto-detect from git remote)
  --custom-domain DOMAIN    Set custom domain (optional)
  --help                    Show this help message

Examples:
  node scripts/setup-github-pages.js
  node scripts/setup-github-pages.js --repo cassandra/mcp-hub
  node scripts/setup-github-pages.js --custom-domain mcphub.io
  npm run setup:github-pages -- --custom-domain mcphub.io
`;
  console.log(help);
}

/**
 * Check prerequisites
 */
function checkPrerequisites() {
  log.info('Checking prerequisites...');

  // Check if gh CLI is installed
  try {
    exec('gh --version', { silent: true });
    log.success('GitHub CLI found');
  } catch {
    log.error('GitHub CLI (gh) is not installed');
    console.log('Install it from: https://cli.github.com');
    process.exit(1);
  }

  // Check if gh is authenticated
  try {
    exec('gh auth status', { silent: true });
    log.success('GitHub CLI authenticated');
  } catch {
    log.error('GitHub CLI is not authenticated');
    console.log('Run: gh auth login');
    process.exit(1);
  }

  // Check if git is installed
  try {
    exec('git --version', { silent: true });
    log.success('Git found');
  } catch {
    log.error('Git is not installed');
    process.exit(1);
  }
}

/**
 * Detect repository from git remote
 */
function detectRepo() {
  if (config.repo) {
    log.success(`Repository: ${config.repo}`);
    return;
  }

  log.info('Detecting repository from git remote...');

  try {
    const originUrl = exec(`git -C "${config.projectRoot}" config --get remote.origin.url`, {
      silent: true,
      throwError: false,
    });

    if (!originUrl) {
      log.error('Could not detect repository from git remote');
      console.log('Please specify with: --repo OWNER/REPO');
      process.exit(1);
    }

    // Parse OWNER/REPO from URL
    const match = originUrl.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/);
    if (match) {
      config.repo = `${match[1]}/${match[2]}`;
    } else {
      log.error(`Could not parse repository from: ${originUrl}`);
      process.exit(1);
    }
  } catch (error) {
    log.error('Error detecting repository');
    console.error(error.message);
    process.exit(1);
  }

  log.success(`Repository: ${config.repo}`);
}

/**
 * Enable GitHub Pages
 */
function enableGitHubPages() {
  log.info('Enabling GitHub Pages...');

  try {
    // Check current Pages status
    const statusCmd = `gh api repos/${config.repo}/pages 2>/dev/null`;
    const status = exec(statusCmd, { silent: true, throwError: false });

    if (!status) {
      log.info('GitHub Pages not yet configured, enabling...');

      const payload = {
        build_type: 'workflow',
        source: {
          branch: 'main',
        },
      };

      exec(`gh api repos/${config.repo}/pages --input - <<'EOF'\n${JSON.stringify(payload)}\nEOF`, {
        throwError: false,
      });

      log.success('GitHub Pages enabled with GitHub Actions');
    } else {
      log.warning('GitHub Pages already configured');
    }
  } catch (error) {
    log.warning('Could not enable GitHub Pages (may already be configured)');
  }
}

/**
 * Enable workflow permissions
 */
function enableWorkflowPermissions() {
  log.info('Configuring workflow permissions...');

  try {
    exec(`gh api repos/${config.repo} -X PATCH -f "actions_default_workflow_permissions=write"`, {
      throwError: false,
    });
    log.success('Workflow permissions configured');
  } catch (error) {
    log.warning('Could not configure workflow permissions');
  }
}

/**
 * Set custom domain
 */
function setCustomDomain() {
  if (!config.customDomain) {
    return;
  }

  log.info(`Setting custom domain: ${config.customDomain}`);

  try {
    const payload = { cname: config.customDomain };
    exec(`gh api repos/${config.repo}/pages -X PUT -f "cname=${config.customDomain}"`, {
      throwError: false,
    });

    log.success(`Custom domain set to: ${config.customDomain}`);
    log.warning("Update your domain's DNS records to point to GitHub Pages");
    console.log("  A records: Point to GitHub's IP addresses");
    console.log('    185.199.108.153');
    console.log('    185.199.109.153');
    console.log('    185.199.110.153');
    console.log('    185.199.111.153');
    console.log('  CNAME: Point to <username>.github.io');
  } catch (error) {
    log.warning('Could not set custom domain');
  }
}

/**
 * Verify setup
 */
function verifySetup() {
  log.info('Verifying GitHub Pages setup...');

  try {
    const pagesInfo = exec(`gh api repos/${config.repo}/pages`, { silent: true });
    const pages = JSON.parse(pagesInfo);

    log.success(`GitHub Pages Status: ${pages.status}`);

    if (pages.html_url) {
      log.success(`Landing page URL: ${pages.html_url}`);
    }

    if (pages.cname) {
      log.success(`Custom domain: ${pages.cname}`);
    }
  } catch (error) {
    log.warning('Could not verify GitHub Pages setup');
  }
}

/**
 * Check workflow status
 */
function checkWorkflowStatus() {
  log.info('Checking workflow status...');

  try {
    const runsInfo = exec(
      `gh api repos/${config.repo}/actions/workflows/deploy-landing-page.yml/runs`,
      { silent: true },
    );
    const runs = JSON.parse(runsInfo);

    if (!runs.workflow_runs || runs.workflow_runs.length === 0) {
      log.warning('No workflow runs found yet');
      log.info('Trigger a workflow by pushing changes to the landing/ directory');
      return;
    }

    const latestRun = runs.workflow_runs[0];
    log.success(`Latest workflow run: ${latestRun.status} (${latestRun.conclusion})`);

    if (latestRun.html_url) {
      log.info(`View workflow: ${latestRun.html_url}`);
    }
  } catch (error) {
    log.warning('Could not check workflow status');
  }
}

/**
 * Print summary
 */
function printSummary() {
  console.log('');
  console.log(
    `${colors.green}═══════════════════════════════════════════════════════════${colors.reset}`,
  );
  console.log(`${colors.green}GitHub Pages Setup Complete!${colors.reset}`);
  console.log(
    `${colors.green}═══════════════════════════════════════════════════════════${colors.reset}`,
  );
  console.log('');
  console.log(`Repository: ${config.repo}`);
  console.log('Workflow: .github/workflows/deploy-landing-page.yml');
  console.log('Landing page directory: landing/');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Commit and push changes to main branch');
  console.log(`  2. Go to: https://github.com/${config.repo}/actions`);
  console.log('  3. Monitor the "Deploy Landing Page to GitHub Pages" workflow');
  console.log('  4. Your landing page will be available at the GitHub Pages URL');
  console.log('');
}

/**
 * Main function
 */
function main() {
  console.log(`${colors.blue}`);
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     GitHub Pages Setup Automation Script                  ║');
  console.log('║     MCP Hub Landing Page Deployment                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}`);
  console.log('');

  parseArgs();
  checkPrerequisites();
  detectRepo();
  enableGitHubPages();
  enableWorkflowPermissions();
  setCustomDomain();
  verifySetup();
  checkWorkflowStatus();
  printSummary();
}

// Run main function
main();
