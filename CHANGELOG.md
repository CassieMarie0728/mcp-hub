# Changelog

All notable changes to MCP Hub are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project aims to follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Root-level documentation site configuration and landing page files to support documentation deployment.

### Changed
- Reworked the root README to reflect the current codebase, runtime entry points, script surface, deployment assets, and MySQL-oriented database configuration.
- Expanded the contributor guide with setup, environment, testing, database workflow, and documentation expectations tied to the current repository.

### Fixed
- Clarified that the currently mounted top-level backend routers are `system`, `auth`, `mcp`, and `mcpServers`.
- Corrected repository-level database wording to align with Drizzle MySQL schema usage, `mysql2`, and the current `DATABASE_URL` example.

### Documentation
- Improved the documentation landing and overview direction across the root docs and `docs/` tree.
- Began normalizing repository documentation toward code-grounded, maintenance-friendly technical guidance.

## [1.0.0] - 2026-04-09

### Added
- Initial MCP Hub application baseline with Expo client and TypeScript backend.
