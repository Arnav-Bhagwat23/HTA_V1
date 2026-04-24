# HTA_V1

HTA_V1 is a monorepo for a Health Technology Assessment landscaping application.

The repo is being built as a monolith-plus-worker system:
- `apps/web` owns API routes, auth, and user-facing job access
- `apps/worker` owns async job processing
- `packages/shared` holds shared contracts used by both sides
- `prisma` defines the database model and migrations

## What Works Today

Two required product branches now exist.

### 1. Automatic AU Path

The automatic Australia (`AU`) slice works end to end:

1. authenticated user submits a search
2. `POST /api/search` creates a `SearchJob`
3. the job is enqueued with BullMQ/Redis
4. worker consumes the job
5. query normalization runs
6. supported geography routes to PBAC
7. PBAC retrieval returns a selected document through a fixture/live boundary
8. PDF parsing runs through `parsePdfDocument(...)`
9. extraction derives persisted fields including:
   - `source_document_title`
   - `document_text_available`
   - `hta_decision`
10. worker persists:
   - `JobSource`
   - `DocumentConsidered`
   - `FieldExtraction`
   - `JobOutput`
11. status, preview, and CSV download APIs read from persisted state

### 2. Manual Upload Path

The manual-upload branch is now wired structurally:

1. authenticated user submits upload metadata or multipart files to `POST /api/uploads`
2. `UploadedDocument` rows are created for a user-owned job
3. upload work is enqueued through BullMQ/Redis
4. `processUploadJob(...)` reads uploaded files
5. uploaded PDFs are parsed and extracted
6. worker persists:
   - `UploadedDocument.parseStatus`
   - `FieldExtraction` rows linked by `uploadedDocumentId`
   - `JobOutput`
7. upload-processing audit events are written

This means the repo now proves both core product branches structurally:
- automatic retrieval/extraction
- manual upload/extraction

## Current Boundaries

The automatic pipeline currently looks like this:

```text
POST /api/search
  -> SearchJob created
  -> BullMQ job enqueued
  -> worker starts
  -> normalizeQuery(...)
  -> routeSourcePlans(...)
  -> adapter lookup
  -> PBAC adapter returns SelectedDocument
  -> parsePdfDocument(...)
  -> extractFieldsFromParsedDocument(...)
  -> worker persists document, fields, and downloadable output
  -> status / preview / download routes read persisted state
```

The manual-upload pipeline currently looks like this:

```text
POST /api/uploads
  -> UploadedDocument rows created
  -> BullMQ upload job enqueued
  -> worker starts upload processing
  -> parse uploaded PDF
  -> extractFieldsFromParsedDocument(...)
  -> worker persists upload-linked fields and downloadable output
```

The main replaceable boundaries are now explicit:
- PBAC retrieval has `fixture` and `live` modes
- PDF parsing has `mock` and `live` modes
- extraction is still lightweight/rule-based, but no longer fully placeholder logic

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
- `apps/web/app/api/uploads/route.ts`
- `apps/web/app/api/jobs/[jobId]/status/route.ts`
- `apps/web/app/api/jobs/[jobId]/preview/route.ts`
- `apps/web/app/api/jobs/[jobId]/download/route.ts`
- `apps/worker/src/jobs/process-search.job.ts`
- `apps/worker/src/jobs/process-upload.job.ts`
- `apps/worker/src/normalizer/normalize-query.ts`
- `apps/worker/src/routing/source-router.ts`
- `apps/worker/src/adapters/pbac.adapter.ts`
- `apps/worker/src/adapters/pbac.parser.ts`
- `apps/worker/src/parsing/pdf-parser.ts`
- `apps/worker/src/parsing/pdf-text-extractor.ts`
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
npm run infra:up
npm run infra:down
npm run infra:logs
npm run web
npm run worker
npm test
npm run prisma:validate
npm run prisma:seed
```

### Environment

The repo expects `DATABASE_URL` for Prisma and `REDIS_URL` for BullMQ.

Copy `.env.example` to `.env` for local development.

Example values:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/hta_v1
REDIS_URL=redis://127.0.0.1:6379
```

Optional worker boundary flags:

```bash
PBAC_RETRIEVAL_MODE=fixture
PDF_PARSER_MODE=mock
```

Supported current values:
- `PBAC_RETRIEVAL_MODE=fixture|live`
- `PDF_PARSER_MODE=mock|live`

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

### Predictable Local Run

One simple local startup sequence is:

```bash
npm run infra:up
npm run prisma:validate
npm run prisma:seed
npm run worker
```

Then start the web/API process in a separate terminal:

```bash
npm run web
```

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

The repo now includes worker-focused tests covering:

- `normalize-query`
- `source-router`
- `extract-fields`
- `pdf-parser`
- `http-client`
- `pbac.adapter`
- `pbac.parser`
- AU search job integration path
- manual upload integration path

Run them with:

```bash
npm test
```

## Current Limitations

This is still a scaffolded but working prototype. Current limitations include:

- PBAC live retrieval only has first-pass document discovery, not full scraping robustness
- the default AU path still uses mock parser mode unless `PDF_PARSER_MODE=live` is set
- extraction is still narrow and rule-based rather than source-specific
- preview/download are API handlers; there is not yet a full user-facing web app shell
- upload route and upload worker are wired, but broader upload UX and retry/orchestration are still minimal

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

- harden live PBAC retrieval and discovery parsing
- make `PDF_PARSER_MODE=live` the exercised default path once stable
- expand extraction rules beyond the first `hta_decision` heuristic
- add upload queue producer/consumer integration tests
- add stronger app-level route/integration tests

## Status Summary

This repo is no longer just architecture scaffolding.

It already demonstrates a real persisted async job flow with:
- queueing
- worker execution
- source routing
- selected document persistence
- uploaded document persistence
- parsed-text boundary
- text-driven extraction boundary
- preview output
- CSV output
