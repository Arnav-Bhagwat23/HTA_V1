# HTA_V1

HTA_V1 is the starting repository for a Health Technology Assessment landscaping application.

The target system is a monolith-plus-worker architecture:
- `apps/web` will host the Next.js UI and API routes
- `apps/worker` will process asynchronous search and upload jobs
- `packages/shared` will hold shared domain contracts used by both web and worker
- `prisma` will define the persistent data model

The product contract this repo is aiming to prove end to end is:
1. a user logs in
2. submits an HTA search
3. a background job is queued
4. the worker processes the job
5. a preview is stored and shown
6. a CSV is generated and downloadable
7. unsupported countries branch into manual upload
8. admin users can inspect failures and source health

## Current Status

The repo is in early scaffold mode. The first shared contracts have been added under `packages/shared/src`:
- geography constants and helpers
- warning codes
- normalized query typing
- job mode and job status typing

## Initial Scope

The first vertical slice will focus on:
- one automatic-country adapter
- latest-document-only retrieval
- a minimal extraction schema
- preview and CSV output

Unsupported countries will route to a manual upload workflow rather than automatic retrieval.

## Repo Direction

Planned top-level structure:

```text
packages/
  shared/
apps/
  web/
  worker/
prisma/
scripts/
docs/
tests/
```

## Notes

- This repository is intended to be clone-and-run once the core scaffold is in place.
- The implementation will favor shared contracts first to avoid drift between the web app and worker.
- Historical backfill is explicitly out of scope: extraction should use only the latest relevant document.
