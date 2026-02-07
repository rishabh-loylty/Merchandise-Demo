# Rewardify - Reward Redemption Marketplace

## Overview
A multi-merchant rewards portal / marketplace where bank customers can redeem loyalty points for products. Built with Next.js 16 frontend with integrated API routes and PostgreSQL (Neon) database.

## Project Architecture
- **Frontend + API**: Next.js 16 app in `frontend/` directory
  - Uses React 19, Tailwind CSS 4, Radix UI components
  - API routes under `frontend/src/app/api/`
  - Database access via `@neondatabase/serverless` in `frontend/src/lib/db.ts`
- **Backend (Java)**: Spring Boot skeleton in `backend/` (not currently active/needed)
- **Database**: PostgreSQL (Neon-backed via Replit)

## Key Directories
- `frontend/src/app/` - Next.js pages and API routes
- `frontend/src/app/store/` - Customer-facing store pages
- `frontend/src/app/admin/` - Admin panel pages
- `frontend/src/app/merchant/` - Merchant dashboard pages
- `frontend/src/app/api/` - API route handlers
- `frontend/src/components/` - Reusable React components
- `frontend/src/lib/` - Utilities (db, fetcher, types, etc.)
- `frontend/scripts/` - Database seed scripts

## Running
- Dev server: `cd frontend && npx next dev -H 0.0.0.0 -p 5000`
- Seed database: `cd frontend && node scripts/seed-neon.mjs`

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)

## Recent Changes
- Configured `allowedDevOrigins` in `next.config.mjs` for Replit proxy compatibility
- Seeded database with initial schema and sample data (currencies, loyalty partners, etc.)
- Set up deployment configuration for autoscale
