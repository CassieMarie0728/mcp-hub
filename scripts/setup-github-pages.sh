#!/bin/bash

###############################################################################
# GitHub Pages Setup Automation Script
# 
# This script automates the setup of GitHub Pages for the MCP Hub landing page.
# It requires GitHub CLI (gh) to be installed and authenticated.
#
# Usage:
#   ./scripts/setup-github-pages.sh [options]
#
# Options:
#   --repo OWNER/REPO     GitHub repository (default: auto-detect from git remote)
#   --custom-domain DOMAIN  Set custom domain (optional)
#   --help               Show this help message
#
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO=""
CUSTOM_DOMAIN=""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

###############################################################################
# Helper Functions
###############################################################################

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

print_help() {
    grep "^#" "$0" | grep -v "^#!/bin/bash" | sed 's/^# //'
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if gh CLI is installed
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) is not installed"
        echo "Install it from: https://cli.github.com"
        exit 1
    fi
    log_success "GitHub CLI found"

    # Check if gh is authenticated
    if ! gh auth status &> /dev/null; then
        log_error "GitHub CLI is not authenticated"
        echo "Run: gh auth login"
        exit 1
    fi
    log_success "GitHub CLI authenticated"

    # Check if git is installed
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed"
        exit 1
    fi
    log_success "Git found"
}

detect_repo() {
    if [ -z "$REPO" ]; then
        log_info "Detecting repository from git remote..."
        
        # Get origin URL
        ORIGIN_URL=$(git -C "$PROJECT_ROOT" config --get remote.origin.url 2>/dev/null || echo "")
        
        if [ -z "$ORIGIN_URL" ]; then
            log_error "Could not detect repository from git remote"
            echo "Please specify with: --repo OWNER/REPO"
            exit 1
        fi

        # Parse OWNER/REPO from URL
        if [[ $ORIGIN_URL =~ github\.com[:/]([^/]+)/(.+?)(.git)?$ ]]; then
            OWNER="${BASH_REMATCH[1]}"
            REPO_NAME="${BASH_REMATCH[2]}"
            REPO="$OWNER/$REPO_NAME"
        else
            log_error "Could not parse repository from: $ORIGIN_URL"
            exit 1
        fi
    fi

    log_success "Repository: $REPO"
}

enable_github_pages() {
    log_info "Enabling GitHub Pages..."

    # Check current Pages status
    PAGES_STATUS=$(gh api repos/"$REPO"/pages 2>/dev/null || echo "")

    if [ -z "$PAGES_STATUS" ]; then
        log_info "GitHub Pages not yet configured, enabling..."
        
        # Enable GitHub Pages with GitHub Actions as source
        gh api repos/"$REPO"/pages \
            --input - <<EOF
{
  "build_type": "workflow",
  "source": {
    "branch": "main"
  }
}
EOF
        log_success "GitHub Pages enabled with GitHub Actions"
    else
        log_warning "GitHub Pages already configured"
    fi
}

enable_workflow_permissions() {
    log_info "Configuring workflow permissions..."

    # Update repository settings for workflow permissions
    gh api repos/"$REPO" \
        -X PATCH \
        -f "actions_default_workflow_permissions=write" \
        -F "actions_default_workflow_permissions_default_workflow_permissions_in_organization=true" \
        > /dev/null 2>&1 || true

    log_success "Workflow permissions configured"
}

set_custom_domain() {
    if [ -z "$CUSTOM_DOMAIN" ]; then
        return
    fi

    log_info "Setting custom domain: $CUSTOM_DOMAIN"

    gh api repos/"$REPO"/pages \
        -X PUT \
        -f "cname=$CUSTOM_DOMAIN" \
        > /dev/null 2>&1

    log_success "Custom domain set to: $CUSTOM_DOMAIN"
    log_warning "Update your domain's DNS records to point to GitHub Pages"
    echo "  A records: Point to GitHub's IP addresses (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153)"
    echo "  CNAME: Point to $(gh api repos/"$REPO" --jq '.owner.login').github.io"
}

verify_setup() {
    log_info "Verifying GitHub Pages setup..."

    # Get Pages info
    PAGES_INFO=$(gh api repos/"$REPO"/pages)
    
    STATUS=$(echo "$PAGES_INFO" | jq -r '.status' 2>/dev/null || echo "unknown")
    URL=$(echo "$PAGES_INFO" | jq -r '.html_url' 2>/dev/null || echo "")
    CNAME=$(echo "$PAGES_INFO" | jq -r '.cname' 2>/dev/null || echo "")

    log_success "GitHub Pages Status: $STATUS"
    
    if [ -n "$URL" ]; then
        log_success "Landing page URL: $URL"
    fi

    if [ -n "$CNAME" ] && [ "$CNAME" != "null" ]; then
        log_success "Custom domain: $CNAME"
    fi
}

check_workflow_status() {
    log_info "Checking workflow status..."

    # Get latest workflow run
    WORKFLOW_RUN=$(gh api repos/"$REPO"/actions/workflows/deploy-landing-page.yml/runs --jq '.workflow_runs[0]' 2>/dev/null || echo "")

    if [ -z "$WORKFLOW_RUN" ] || [ "$WORKFLOW_RUN" = "null" ]; then
        log_warning "No workflow runs found yet"
        log_info "Trigger a workflow by pushing changes to the landing/ directory"
        return
    fi

    RUN_STATUS=$(echo "$WORKFLOW_RUN" | jq -r '.status' 2>/dev/null || echo "unknown")
    RUN_CONCLUSION=$(echo "$WORKFLOW_RUN" | jq -r '.conclusion' 2>/dev/null || echo "unknown")
    RUN_URL=$(echo "$WORKFLOW_RUN" | jq -r '.html_url' 2>/dev/null || echo "")

    log_success "Latest workflow run: $RUN_STATUS ($RUN_CONCLUSION)"
    
    if [ -n "$RUN_URL" ]; then
        log_info "View workflow: $RUN_URL"
    fi
}

print_summary() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}GitHub Pages Setup Complete!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Repository: $REPO"
    echo "Workflow: .github/workflows/deploy-landing-page.yml"
    echo "Landing page directory: landing/"
    echo ""
    echo "Next steps:"
    echo "  1. Commit and push changes to main branch"
    echo "  2. Go to: https://github.com/$REPO/actions"
    echo "  3. Monitor the 'Deploy Landing Page to GitHub Pages' workflow"
    echo "  4. Your landing page will be available at the GitHub Pages URL"
    echo ""
}

###############################################################################
# Main Script
###############################################################################

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --repo)
                REPO="$2"
                shift 2
                ;;
            --custom-domain)
                CUSTOM_DOMAIN="$2"
                shift 2
                ;;
            --help)
                print_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                print_help
                exit 1
                ;;
        esac
    done

    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║     GitHub Pages Setup Automation Script                  ║"
    echo "║     MCP Hub Landing Page Deployment                       ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""

    check_prerequisites
    detect_repo
    enable_github_pages
    enable_workflow_permissions
    set_custom_domain
    verify_setup
    check_workflow_status
    print_summary
}

# Run main function
main "$@"
