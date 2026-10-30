# Deployment Guide

## Pre-deployment
1. Confirm repository and deployed source are synchronized.
2. Configure build/start commands from the real package manifest.
3. Set environment variables through the hosting provider's secret manager.
4. Configure API URLs per environment rather than hard-coding production endpoints.
5. Run configured checks and a production build.
6. Smoke-test district-first navigation, API health, and mobile layout.

## Environments
Keep development, preview/staging, and production settings separate. Do not run test imports against production data. Use HTTPS and least-privilege database credentials.

## Release
Review a pull request and ensure required checks pass. Deploy to preview, test directory/dashboard/detail routes and error states, then promote using the hosting provider's release process. Record the deployed commit SHA and release notes.

## Rollback and security
Keep the last known-good deployment available. Roll back if navigation, data integrity, or API access breaks. Never commit secrets. Before election-day submissions, implement authentication, authorization, validation, rate limiting, audit logs, and tested backups.
