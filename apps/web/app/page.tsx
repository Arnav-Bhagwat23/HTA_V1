'use client';

import type { CSSProperties, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

type JobApiStatus = 'queued' | 'running' | 'completed' | 'partial' | 'failed';
type JobApiMode = 'automatic' | 'manual_upload';

interface SearchResponseBody {
  jobId: string;
  mode: JobApiMode;
  normalizedQuery: unknown;
  status: JobApiStatus;
}

interface JobStatusResponseBody {
  jobId: string;
  mode: JobApiMode;
  status: JobApiStatus;
  timestamps: {
    completedAt: string | null;
    createdAt: string;
    startedAt: string | null;
    updatedAt: string;
  };
}

interface PreviewFieldEvidence {
  documentId: string;
  documentTitle: string | null;
  documentUrl: string | null;
  publishedAt: string | null;
  snippet: string | null;
  sourcePage: string | null;
}

interface PreviewField {
  confidence: number | null;
  evidence: PreviewFieldEvidence[];
  fieldLabel: string;
  fieldName: string;
  value: string | null;
  warningCodes: string[];
}

interface PreviewResponseBody {
  downloadable: boolean;
  fields: PreviewField[];
  jobId: string;
  mode: JobApiMode;
  status: JobApiStatus;
  warnings: string[];
}

const INITIAL_QUERY = 'Jemperli endometrial cancer Australia';

const TERMINAL_STATUSES: JobApiStatus[] = ['completed', 'partial', 'failed'];

const pageStyles = {
  shell: {
    background:
      'radial-gradient(circle at top left, #f9dfc8 0%, #f4efe8 40%, #e6ebf0 100%)',
    color: '#16212b',
    minHeight: '100vh',
    padding: '32px 20px 48px',
  },
  panel: {
    backdropFilter: 'blur(14px)',
    background: 'rgba(255,255,255,0.78)',
    border: '1px solid rgba(22,33,43,0.08)',
    borderRadius: '24px',
    boxShadow: '0 24px 60px rgba(22,33,43,0.14)',
    margin: '0 auto',
    maxWidth: '1100px',
    padding: '28px',
  },
  hero: {
    display: 'grid',
    gap: '16px',
    marginBottom: '28px',
  },
  heading: {
    fontFamily: 'Georgia, Times New Roman, serif',
    fontSize: 'clamp(2rem, 5vw, 3.6rem)',
    lineHeight: 1,
    margin: 0,
  },
  subheading: {
    fontSize: '1rem',
    lineHeight: 1.6,
    margin: 0,
    maxWidth: '720px',
    opacity: 0.85,
  },
  form: {
    display: 'grid',
    gap: '12px',
    marginBottom: '24px',
  },
  textarea: {
    background: 'rgba(247, 243, 238, 0.96)',
    border: '1px solid rgba(22,33,43,0.12)',
    borderRadius: '18px',
    color: '#16212b',
    fontFamily: 'inherit',
    fontSize: '1rem',
    minHeight: '92px',
    padding: '16px 18px',
    resize: 'vertical' as const,
  },
  buttonRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  primaryButton: {
    background: '#16212b',
    border: 'none',
    borderRadius: '999px',
    color: '#fff8f0',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 600,
    padding: '12px 20px',
  },
  secondaryButton: {
    background: 'transparent',
    border: '1px solid rgba(22,33,43,0.18)',
    borderRadius: '999px',
    color: '#16212b',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 600,
    padding: '12px 20px',
  },
  statusGrid: {
    display: 'grid',
    gap: '16px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    marginBottom: '24px',
  },
  card: {
    background: 'rgba(255,255,255,0.88)',
    border: '1px solid rgba(22,33,43,0.08)',
    borderRadius: '20px',
    padding: '18px',
  },
  cardLabel: {
    fontSize: '0.76rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    margin: '0 0 8px',
    opacity: 0.65,
    textTransform: 'uppercase' as const,
  },
  cardValue: {
    fontSize: '1rem',
    fontWeight: 600,
    margin: 0,
    overflowWrap: 'anywhere' as const,
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    margin: '0 0 12px',
  },
  fieldList: {
    display: 'grid',
    gap: '12px',
  },
  fieldCard: {
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(22,33,43,0.08)',
    borderRadius: '16px',
    padding: '14px 16px',
  },
  fieldMeta: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginTop: '10px',
  },
  badge: {
    background: 'rgba(22,33,43,0.08)',
    borderRadius: '999px',
    fontSize: '0.78rem',
    padding: '4px 10px',
  },
  linkRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '12px',
    marginTop: '12px',
  },
  link: {
    color: '#0a5c8d',
    fontWeight: 600,
    textDecoration: 'none',
  },
  helper: {
    fontSize: '0.9rem',
    margin: 0,
    opacity: 0.8,
  },
  error: {
    color: '#9f2f1e',
    fontWeight: 600,
    margin: 0,
  },
} satisfies Record<string, CSSProperties>;

export default function HomePage() {
  const [query, setQuery] = useState(INITIAL_QUERY);
  const [sessionReady, setSessionReady] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusResponseBody | null>(null);
  const [preview, setPreview] = useState<PreviewResponseBody | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBootstrappingSession, setIsBootstrappingSession] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const bootstrapSession = async () => {
      setIsBootstrappingSession(true);
      setErrorMessage(null);

      try {
        const response = await fetch('/api/dev/session', {
          method: 'POST',
        });

        const body = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(body?.error ?? 'Failed to create a local dev session.');
        }

        if (!isCancelled) {
          setSessionReady(true);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Failed to create a local dev session.',
          );
        }
      } finally {
        if (!isCancelled) {
          setIsBootstrappingSession(false);
        }
      }
    };

    void bootstrapSession();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!jobId || !sessionReady) {
      return;
    }

    let isCancelled = false;
    let intervalHandle: ReturnType<typeof setInterval> | null = null;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}/status`, {
          cache: 'no-store',
        });
        const body = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(body?.error ?? 'Failed to fetch job status.');
        }

        if (isCancelled) {
          return;
        }

        setJobStatus(body);

        if (TERMINAL_STATUSES.includes(body.status)) {
          if (intervalHandle) {
            clearInterval(intervalHandle);
          }

          const previewResponse = await fetch(`/api/jobs/${jobId}/preview`, {
            cache: 'no-store',
          });
          const previewBody = await previewResponse.json().catch(() => null);

          if (!previewResponse.ok) {
            throw new Error(previewBody?.error ?? 'Failed to fetch job preview.');
          }

          if (!isCancelled) {
            setPreview(previewBody);
          }
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Failed while polling job state.',
          );
        }

        if (intervalHandle) {
          clearInterval(intervalHandle);
        }
      }
    };

    void fetchStatus();
    intervalHandle = setInterval(() => {
      void fetchStatus();
    }, 2000);

    return () => {
      isCancelled = true;

      if (intervalHandle) {
        clearInterval(intervalHandle);
      }
    };
  }, [jobId, sessionReady]);

  const submitSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!sessionReady || !query.trim()) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setJobId(null);
    setJobStatus(null);
    setPreview(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
        }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error ?? 'Failed to create search job.');
      }

      const data = body as SearchResponseBody;
      setJobId(data.jobId);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to create search job.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewFields = preview?.fields ?? [];
  const statusText = useMemo(() => {
    if (isBootstrappingSession) {
      return 'Preparing local dev session';
    }

    if (jobStatus) {
      return jobStatus.status;
    }

    return sessionReady ? 'ready' : 'waiting';
  }, [isBootstrappingSession, jobStatus, sessionReady]);

  return (
    <main style={pageStyles.shell}>
      <section style={pageStyles.panel}>
        <div style={pageStyles.hero}>
          <p style={pageStyles.cardLabel}>HTA Extraction Platform</p>
          <h1 style={pageStyles.heading}>Search one query, verify one workbook.</h1>
          <p style={pageStyles.subheading}>
            This minimal UI creates a search job, polls worker status, shows the
            simplified preview, and lets us download the generated workbook or CSV
            while we tune real LLM normalization and extraction.
          </p>
        </div>

        <form onSubmit={submitSearch} style={pageStyles.form}>
          <textarea
            aria-label="Search query"
            disabled={!sessionReady || isSubmitting || isBootstrappingSession}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Enter drug, indication, and country"
            style={pageStyles.textarea}
            value={query}
          />

          <div style={pageStyles.buttonRow}>
            <button
              disabled={!sessionReady || isSubmitting || isBootstrappingSession || query.trim().length === 0}
              style={pageStyles.primaryButton}
              type="submit"
            >
              {isSubmitting ? 'Submitting search...' : 'Run search'}
            </button>

            <button
              disabled={isSubmitting}
              onClick={() => {
                setQuery(INITIAL_QUERY);
              }}
              style={pageStyles.secondaryButton}
              type="button"
            >
              Load AU example
            </button>
          </div>
        </form>

        {errorMessage ? <p style={pageStyles.error}>{errorMessage}</p> : null}

        <div style={pageStyles.statusGrid}>
          <article style={pageStyles.card}>
            <p style={pageStyles.cardLabel}>Session</p>
            <p style={pageStyles.cardValue}>
              {sessionReady ? 'Local standard user session ready' : statusText}
            </p>
          </article>

          <article style={pageStyles.card}>
            <p style={pageStyles.cardLabel}>Job</p>
            <p style={pageStyles.cardValue}>{jobId ?? 'No job yet'}</p>
          </article>

          <article style={pageStyles.card}>
            <p style={pageStyles.cardLabel}>Status</p>
            <p style={pageStyles.cardValue}>{jobStatus?.status ?? 'idle'}</p>
          </article>

          <article style={pageStyles.card}>
            <p style={pageStyles.cardLabel}>Mode</p>
            <p style={pageStyles.cardValue}>{jobStatus?.mode ?? 'automatic'}</p>
          </article>
        </div>

        {jobId ? (
          <section style={pageStyles.card}>
            <h2 style={pageStyles.sectionTitle}>Outputs</h2>
            <p style={pageStyles.helper}>
              Default download is workbook-first. CSV remains available as a secondary export.
            </p>
            <div style={pageStyles.linkRow}>
              <a href={`/api/jobs/${jobId}/download`} style={pageStyles.link}>
                Download workbook (.xlsx)
              </a>
              <a href={`/api/jobs/${jobId}/download?format=csv`} style={pageStyles.link}>
                Download CSV
              </a>
              <a href={`/api/jobs/${jobId}/preview`} style={pageStyles.link} target="_blank" rel="noreferrer">
                Open preview JSON
              </a>
              <a href={`/api/jobs/${jobId}/status`} style={pageStyles.link} target="_blank" rel="noreferrer">
                Open status JSON
              </a>
            </div>
          </section>
        ) : null}

        <section style={{ ...pageStyles.card, marginTop: '24px' }}>
          <h2 style={pageStyles.sectionTitle}>Preview</h2>
          {previewFields.length === 0 ? (
            <p style={pageStyles.helper}>
              No preview fields yet. Submit a query and wait for a terminal status.
            </p>
          ) : (
            <div style={pageStyles.fieldList}>
              {previewFields.map((field) => (
                <article key={`${field.fieldName}-${field.fieldLabel}`} style={pageStyles.fieldCard}>
                  <p style={pageStyles.cardLabel}>{field.fieldLabel}</p>
                  <p style={pageStyles.cardValue}>{field.value ?? 'No value extracted'}</p>
                  <div style={pageStyles.fieldMeta}>
                    <span style={pageStyles.badge}>{field.fieldName}</span>
                    <span style={pageStyles.badge}>
                      confidence: {field.confidence ?? 'n/a'}
                    </span>
                    <span style={pageStyles.badge}>
                      evidence: {field.evidence.length}
                    </span>
                    {field.warningCodes.map((warningCode) => (
                      <span key={warningCode} style={pageStyles.badge}>
                        {warningCode}
                      </span>
                    ))}
                  </div>
                  {field.evidence[0] ? (
                    <p style={{ ...pageStyles.helper, marginTop: '10px' }}>
                      {field.evidence[0].documentTitle ?? 'Untitled document'}
                      {field.evidence[0].sourcePage ? ` · page ${field.evidence[0].sourcePage}` : ''}
                      {field.evidence[0].snippet ? ` · ${field.evidence[0].snippet}` : ''}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
