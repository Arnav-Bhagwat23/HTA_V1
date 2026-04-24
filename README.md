# HTA_V1

HTA_V1 is a monorepo for a Health Technology Assessment landscaping application.

The repo is being built as a monolith-plus-worker system:
- `apps/web` owns API routes, auth, and user-facing job access
- `apps/worker` owns async job processing
- `packages/shared` holds shared contracts used by both sides
- `prisma` defines the database model and migrations

## What Works Today

The first automatic mock vertical slice is working end to end for Australia (`AU`):

1. authenticated user submits a search
2. `POST /api/search` creates a `SearchJob`
3. the job is enqueued with BullMQ/Redis
4. worker consumes the job
5. query normalization runs
6. supported geography routes to PBAC
7. PBAC mock adapter returns a mock selected document
8. PDF parser stub returns parsed text
9. extraction helper returns mock extracted fields with evidence
10. worker persists:
   - `JobSource`
   - `DocumentConsidered`
   - `FieldExtraction`
   - `JobOutput`
11. status, preview, and CSV download APIs all work against persisted state

This means the repo already proves the core async architecture and the latest-document-only automatic path with mocked retrieval/parsing/extraction.

## Current Boundaries

The pipeline currently looks like this:

```text
POST /api/search
  -> SearchJob created
  -> BullMQ job enqueued
  -> worker starts
  -> normalizeQuery(...)
  -> routeSourcePlans(...)
  -> adapter lookup
  -> PBAC mock adapter returns SelectedDocument
  -> parsePdfDocument(...)
  -> extractFieldsFromParsedDocument(...)
  -> worker persists document, fields, and downloadable output
  -> status / preview / download routes read persisted state
```

Real scraping and real PDF parsing are not implemented yet. Those boundaries now exist as explicit replaceable layers.

## Repo Structure

```text
packages/
  shared/
apps/
  web/
  worker/
prisma/
```

Important current files:

- `packages/shared/src/index.ts`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `apps/web/app/api/search/route.ts`
- `apps/web/app/api/jobs/[jobId]/status/route.ts`
- `apps/web/app/api/jobs/[jobId]/preview/route.ts`
- `apps/web/app/api/jobs/[jobId]/download/route.ts`
- `apps/worker/src/jobs/process-search.job.ts`
- `apps/worker/src/normalizer/normalize-query.ts`
- `apps/worker/src/routing/source-router.ts`
- `apps/worker/src/adapters/pbac.adapter.ts`
- `apps/worker/src/parsing/pdf-parser.ts`
- `apps/worker/src/extraction/extract-fields.ts`

## Shared Contracts

`packages/shared` currently defines:

- normalized query contract
- job status and mode contracts
- supported geographies and manual-upload rule
- warning codes
- selected/parsed document contracts
- extraction and preview contracts
- search/upload/preview schemas
- shared queue name and Redis config helpers

This package is consumed as raw TypeScript source inside the monorepo through `@hta/shared`.

## Persistence Layer

The Prisma schema already includes the core tables for the v3 architecture:

- `User`
- `Session`
- `SearchJob`
- `JobSource`
- `DocumentConsidered`
- `UploadedDocument`
- `FieldExtraction`
- `JobOutput`
- `AuditEvent`
- `SourceHealthEvent`

The schema supports both:
- automatic-source jobs
- manual-upload jobs

## Local Setup

### Prerequisites

- Node.js
- PostgreSQL
- Redis

Current package scripts:

```bash
npm test
npm run prisma:validate
npm run prisma:seed
npm run worker
```

### Environment

The repo expects `DATABASE_URL` for Prisma and `REDIS_URL` for BullMQ.

Example values:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/hta_v1
REDIS_URL=redis://127.0.0.1:6379
```

The seed script also supports:

```bash
STANDARD_USER_EMAIL
STANDARD_USER_PASSWORD
ADMIN_USER_EMAIL
ADMIN_USER_PASSWORD
```

If unset, local dev defaults are used:

- standard: `user@hta.local`
- admin: `admin@hta.local`

## Database Workflow

Validate schema:

```bash
npm run prisma:validate
```

Run seed:

```bash
npm run prisma:seed
```

Prisma 6.x is pinned intentionally so the repo can keep the classic `schema.prisma` datasource config during scaffolding.

## Test Coverage

The repo now includes a small worker-focused contract test suite covering:

- `normalize-query`
- `source-router`
- `extract-fields`
- `pdf-parser`

Run it with:

```bash
npm test
```

## Current Limitations

This is still a scaffolded but working prototype. Current limitations include:

- PBAC retrieval is mocked
- PDF parsing is mocked
- extraction is mocked
- only the AU automatic path is meaningfully exercised
- web routes exist as API handlers, but a full Next.js app shell is not scaffolded yet
- manual upload flow is modeled in schema/contracts but not yet wired end to end

## Design Rules

The repo is intentionally following these rules:

- web API stays thin
- worker owns normalization, routing, retrieval, parsing, extraction, and output state
- shared contracts live in `packages/shared`
- unsupported geographies branch to manual upload
- automatic extraction uses only the selected latest document
- historical backfill is out of scope

## Next Likely Steps

Near-term next work is likely to be one of:

- replace PBAC mock adapter with real retrieval behavior
- replace mock PDF parsing with real parsing
- replace mock extraction with parser-driven extraction
- wire the manual upload path end to end
- add stronger worker/integration tests

## Status Summary

This repo is no longer just architecture scaffolding.

It already demonstrates a real persisted async job flow with:
- queueing
- worker execution
- source routing
- selected document persistence
- parsed-text boundary
- extraction boundary
- preview output
- CSV output
