"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = "https://ragforge-api-8tv4.onrender.com";

type HealthResponse = {
  status: string;
  service: string;
  version: string;
};

export default function SettingsPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Health check failed");
        }

        const data: HealthResponse = await response.json();
        setHealth(data);
      } catch {
        setHealth(null);
      } finally {
        setLoading(false);
      }
    }

    checkHealth();
  }, []);

  return (
    <main className="settings-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">SYSTEM CONFIGURATION</span>
          <h1>Settings</h1>
          <p className="page-description">
            Inspect the configuration and infrastructure behind your
            RAG evaluation environment.
          </p>
        </div>
      </header>

      <section className="settings-grid">
        <div className="detail-panel settings-section">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">RAG PIPELINE</span>
              <h2>Core configuration</h2>
            </div>
          </div>

          <div className="settings-list">
            <div className="settings-row">
              <div>
                <span>EMBEDDING MODEL</span>
                <small>
                  Semantic representation model used for retrieval.
                </small>
              </div>
              <strong>BAAI/bge-small-en-v1.5</strong>
            </div>

            <div className="settings-row">
              <div>
                <span>EMBEDDING DIMENSIONS</span>
                <small>
                  Vector size stored in PostgreSQL.
                </small>
              </div>
              <strong>384</strong>
            </div>

            <div className="settings-row">
              <div>
                <span>VECTOR STORE</span>
                <small>
                  Database and extension used for semantic search.
                </small>
              </div>
              <strong>PostgreSQL + pgvector</strong>
            </div>

            <div className="settings-row">
              <div>
                <span>CHUNKING</span>
                <small>
                  Documents are divided into overlapping retrieval
                  chunks.
                </small>
              </div>
              <strong>Configurable</strong>
            </div>
          </div>
        </div>

        <div className="detail-panel settings-section">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">GENERATION</span>
              <h2>LLM configuration</h2>
            </div>
          </div>

          <div className="settings-list">
            <div className="settings-row">
              <div>
                <span>LOCAL PROVIDER</span>
                <small>
                  Used by the local development environment.
                </small>
              </div>
              <strong>Ollama</strong>
            </div>

            <div className="settings-row">
              <div>
                <span>LOCAL MODEL</span>
                <small>
                  Local generation and evaluation model.
                </small>
              </div>
              <strong>llama3.2:3b</strong>
            </div>

            <div className="settings-row">
              <div>
                <span>PRODUCTION PROVIDER</span>
                <small>
                  Cloud LLM provider used by the deployed API.
                </small>
              </div>
              <strong>Groq</strong>
            </div>

            <div className="settings-row">
              <div>
                <span>PRODUCTION MODEL</span>
                <small>
                  Model configured for production inference.
                </small>
              </div>
              <strong>openai/gpt-oss-20b</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="detail-panel settings-section">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">API ENVIRONMENT</span>
            <h2>Backend status</h2>
          </div>

          <span
            className={`settings-status ${
              health ? "online" : "offline"
            }`}
          >
            <i />
            {loading
              ? "CHECKING"
              : health
                ? "ONLINE"
                : "UNAVAILABLE"}
          </span>
        </div>

        <div className="settings-list">
          <div className="settings-row">
            <div>
              <span>API ENDPOINT</span>
              <small>
                Production FastAPI service used by the frontend.
              </small>
            </div>

            <strong className="settings-value">
              ragforge-api-8tv4.onrender.com
            </strong>
          </div>

          <div className="settings-row">
            <div>
              <span>SERVICE</span>
              <small>
                Application service reported by the health endpoint.
              </small>
            </div>

            <strong>{health?.service ?? "—"}</strong>
          </div>

          <div className="settings-row">
            <div>
              <span>API VERSION</span>
              <small>
                Currently deployed backend version.
              </small>
            </div>

            <strong>{health?.version ?? "—"}</strong>
          </div>
        </div>
      </section>

      <section className="settings-pipeline">
        <div>
          <span className="eyebrow">SYSTEM PIPELINE</span>
          <h2>RAGForge architecture</h2>
        </div>

        <div className="settings-pipeline-flow">
          <span>DOCUMENTS</span>
          <b>→</b>
          <span>CHUNKS</span>
          <b>→</b>
          <span>EMBEDDINGS</span>
          <b>→</b>
          <span>RETRIEVAL</span>
          <b>→</b>
          <span>GENERATION</span>
          <b>→</b>
          <span>EVALUATION</span>
          <b>→</b>
          <span>BENCHMARK</span>
        </div>
      </section>
    </main>
  );
}