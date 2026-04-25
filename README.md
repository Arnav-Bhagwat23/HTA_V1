# HTA_V1

HTA_V1 is a monorepo for a Health Technology Assessment landscaping application.

`v0.2.0` is the current handoff release. It proves both required product branches:
- automatic retrieval/extraction for every supported automatic country
- manual upload/extraction for unsupported geographies
- workbook download is now the default output path, with CSV preserved as an optional secondary export

The repo is structured as a monolith-plus-worker system:
- `apps/web` owns API routes, auth, and user-facing job access
- `apps/worker` owns async job processing
- `packages/shared` holds shared contracts used by both sides
- `prisma` defines the database model and migrations

## v0.2.0 Summary

What is proven in this release:
- all 7 supported automatic countries are covered by adapters:
  - `AU` / `PBAC`
  - `UK` / `NICE`
  - `DE` / `G-BA`
  - `FR` / `HAS`
  - `IT` / `AIFA`
  - `ES` / `AEMPS`
  - `JP` / `Japan HTA`
- manual upload path works end to end
- async queue + worker flow works
- preview, workbook download, and CSV output are driven from persisted state
- worker integration tests cover every supported automatic geography
- test suite currently passes with `115` tests

## Supported Countries

### Automatic countries

These geographies are currently treated as supported automatic countries:

| Geography | Source |
| --- | --- |
| `AU` | `PBAC` |
| `UK` | `NICE` |
| `DE` | `G-BA` |
| `FR` | `HAS` |
| `IT` | `AIFA` |
| `ES` | `AEMPS` |
| `JP` | `Japan HTA` |

### Unsupported geographies

Any geography that resolves to `OTHER` follows the manual-upload branch:

1. search normalizes geography to `OTHER`
2. worker marks the job `PARTIAL`
3. job requires manual upload
4. user uploads one or more documents
5. upload worker parses and extracts from those uploaded files
6. preview and CSV are built from uploaded-document-backed extractions

This is the current fallback rule for non-supported countries.

## What Works Today

### 1. Automatic path

The automatic path works end to end for all supported automatic countries:

1. authenticated user submits a search
2. `POST /api/search` creates a `SearchJob`
3. the job is enqueued with BullMQ/Redis
4. worker consumes the job
5. query normalization runs
6. supported geography routes to exactly one source plan
7. adapter returns a selected document through a fixture/live boundary
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
11. status, preview, workbook download, and CSV download APIs read from persisted state

### 2. Manual upload path

The manual-upload branch is also wired end to end:

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

## Output Behavior

### Default output

- `GET /api/jobs/:jobId/download` returns `.xlsx` by default

### Optional CSV

- `GET /api/jobs/:jobId/download?format=csv` returns CSV as a secondary export

### Preview

- preview remains a simplified extracted-field view
- preview is not a workbook-style UI

### Workbook status

- `HTA Results` is currently the first populated workbook sheet
- remaining workbook sheets are scaffolded and ready for expansion

## Proven Example Queries

These are concise example queries that currently flow through the automatic worker path:

### AU / PBAC

```text
Mock drug general indication Australia
```

Expected outcome:
- geography normalizes to `AU`
- routing selects `pbac`
- selected document comes from PBAC
- persisted fields include `hta_decision`
- workbook becomes downloadable by default
- CSV remains downloadable as an optional format

### UK / NICE

```text
Mock drug general indication United Kingdom
```

Expected outcome:
- geography normalizes to `UK`
- routing selects `nice`
- selected document comes from NICE
- persisted fields include `hta_decision`
- workbook becomes downloadable by default
- CSV remains downloadable as an optional format

### DE / G-BA

```text
Mock drug general indication Germany
```

Expected outcome:
- geography normalizes to `DE`
- routing selects `gba`
- selected document comes from G-BA
- persisted fields include `hta_decision`
- workbook becomes downloadable by default
- CSV remains downloadable as an optional format

### FR / HAS

```text
Mock drug general indication France
```

Expected outcome:
- geography normalizes to `FR`
- routing selects `has`
- selected document comes from HAS
- persisted fields include `hta_decision`
- workbook becomes downloadable by default
- CSV remains downloadable as an optional format

### IT / AIFA

```text
Mock drug general indication Italy
```

Expected outcome:
- geography normalizes to `IT`
- routing selects `aifa`
- selected document comes from AIFA
- persisted fields include `hta_decision`
- workbook becomes downloadable by default
- CSV remains downloadable as an optional format

### ES / AEMPS

```text
Mock drug general indication Spain
```

Expected outcome:
- geography normalizes to `ES`
- routing selects `aemps`
- selected document comes from AEMPS
- persisted fields include `hta_decision`
- workbook becomes downloadable by default
- CSV remains downloadable as an optional format

### JP / Japan HTA

```text
Mock drug general indication Japan
```

Expected outcome:
- geography normalizes to `JP`
- routing selects `japan`
- selected document comes from Japan HTA
- persisted fields include `hta_decision`
- workbook becomes downloadable by default
- CSV remains downloadable as an optional format

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
  -> source adapter returns SelectedDocument
  -> parsePdfDocument(...)
  -> extractFieldsFromParsedDocument(...)
  -> worker persists document, fields, and downloadable outputs
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
  -> worker persists upload-linked fields and downloadable outputs
```

## Repo Structure

```text
packages/
  shared/
apps/
  web/
  worker/
prisma/
```

Important files:

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
- `apps/worker/src/adapters/`
- `apps/worker/src/parsing/pdf-parser.ts`
- `apps/worker/src/parsing/pdf-text-extractor.ts`
- `apps/worker/src/extraction/extract-fields.ts`

## Shared Contracts

`packages/shared` currently defines:
- normalized query contract
- supported geographies and manual-upload rule
- warning codes
- selected/parsed document contracts
- extraction and preview contracts
- search/upload schemas
- shared queue names and Redis config helpers

## Persistence Layer

The Prisma schema includes the core tables for the v3 architecture:

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
- Docker Desktop running locally, or equivalent local PostgreSQL and Redis services

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

Copy `.env.example` to `.env`.

Example local values:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/hta_v1
REDIS_URL=redis://127.0.0.1:6379
```

Optional worker boundary flags:

```bash
PBAC_RETRIEVAL_MODE=fixture
NICE_RETRIEVAL_MODE=fixture
GBA_RETRIEVAL_MODE=fixture
HAS_RETRIEVAL_MODE=fixture
AIFA_RETRIEVAL_MODE=fixture
AEMPS_RETRIEVAL_MODE=fixture
JAPAN_HTA_RETRIEVAL_MODE=fixture
PDF_PARSER_MODE=mock
```

The seed script also supports:

```bash
STANDARD_USER_EMAIL
STANDARD_USER_PASSWORD
ADMIN_USER_EMAIL
ADMIN_USER_PASSWORD
```

### Predictable Local Run

```bash
npm install
cp .env.example .env
npm run infra:up
npx prisma migrate deploy --schema prisma/schema.prisma
npm run prisma:seed
npm run worker
```

Then in a separate terminal:

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

## Test Coverage

The repo now includes worker-focused tests covering:
- `normalize-query`
- `source-router`
- `extract-fields`
- `pdf-parser`
- `http-client`
- every automatic-country adapter/parser pair
- every supported automatic-country worker integration path
- manual upload integration path

Run them with:

```bash
npm test
```

Current status:
- `27` test files
- `135` passing tests

## Known Limitations

This is still a scaffolded but working prototype. Current limitations include:

- retrieval is still split between `fixture` and `live` boundaries, and live-mode robustness is still early
- extraction is still lightweight and rule-based rather than source-specific/NLP-driven
- automatic adapters currently share a generic latest-PDF discovery strategy rather than source-specialized parsing
- local development expects Docker Desktop or equivalent local infra
- preview/download are API handlers; there is not yet a polished end-user web UI

## Design Rules

The repo intentionally follows these rules:

- web API stays thin
- worker owns normalization, routing, retrieval, parsing, extraction, and output state
- shared contracts live in `packages/shared`
- unsupported geographies branch to manual upload
- automatic extraction uses only the selected latest document
- historical backfill is out of scope

## Status Summary

This repo is no longer just scaffolding.

At `v0.2.0`, it demonstrates a real persisted async job flow with:
- queueing
- worker execution
- source routing
- automatic-country adapters for all supported geographies
- uploaded document persistence
- parsed-text boundary
- text-driven extraction boundary
- preview output
- workbook output by default
- CSV output as a secondary format
