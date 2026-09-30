
"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = "https://ragforge-api-8tv4.onrender.com";

type Dataset = {
  id: number;
  name: string;
  description: string | null;
};

type Document = {
  id: number;
  dataset_id: number;
  name: string;
  content: string;
  source: string | null;
};

type Chunk = {
  id: number;
  document_id: number;
  content: string;
  chunk_index: number;
};

export default function DashboardPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chunkCount, setChunkCount] = useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [datasetsResponse, documentsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/datasets/`),
          fetch(`${API_BASE_URL}/documents/`),
        ]);

        if (!datasetsResponse.ok || !documentsResponse.ok) {
          throw new Error("Failed to load dashboard data");
        }

        const datasetsData: Dataset[] = await datasetsResponse.json();
        const documentsData: Document[] = await documentsResponse.json();

        setDatasets(datasetsData);
        setDocuments(documentsData);

        let totalChunks = 0;

        const chunkResponses = await Promise.all(
          documentsData.map((document) =>
            fetch(`${API_BASE_URL}/chunks/documents/${document.id}`)
          )
        );

        for (const response of chunkResponses) {
          if (!response.ok) {
            continue;
          }

          const chunks: Chunk[] = await response.json();
          totalChunks += chunks.length;
        }

        setChunkCount(totalChunks);
      } catch (error) {
        console.error("Dashboard loading error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SYSTEM OVERVIEW</span>

          <h1>Dashboard</h1>

          <p>
            Monitor your RAG knowledge, retrieval pipeline, and evaluation
            health.
          </p>
        </div>

        <div className="dashboard-status">
          <span className="dashboard-status-dot" />
          System online
        </div>
      </div>

      {/* Overview */}

      <section className="dashboard-overview">
        <div className="overview-stat">
          <span className="stat-label">DATASETS</span>

          <strong>{loading ? "—" : datasets.length}</strong>

          <span className="stat-description">
            Knowledge collections
          </span>
        </div>

        <div className="overview-stat">
          <span className="stat-label">DOCUMENTS</span>

          <strong>{loading ? "—" : documents.length}</strong>

          <span className="stat-description">
            Ingested documents
          </span>
        </div>

        <div className="overview-stat">
          <span className="stat-label">CHUNKS</span>

          <strong>{loading ? "—" : chunkCount}</strong>

          <span className="stat-description">
            Retrievable passages
          </span>
        </div>

        <div className="overview-stat">
          <span className="stat-label">EVALUATIONS</span>

          <strong>—</strong>

          <span className="stat-description">
            Recorded evaluation runs
          </span>
        </div>
      </section>

      {/* Pipeline + Evaluation */}

      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">RAG PIPELINE</span>

              <h2>Knowledge to answer</h2>
            </div>
          </div>

          <div className="dashboard-pipeline">
            <div className="dashboard-pipeline-node">
              <span className="dashboard-pipeline-number">
                01
              </span>

              <strong>Documents</strong>

              <small>Source knowledge</small>
            </div>

            <span className="dashboard-pipeline-arrow">
              →
            </span>

            <div className="dashboard-pipeline-node">
              <span className="dashboard-pipeline-number">
                02
              </span>

              <strong>Chunks</strong>

              <small>Context units</small>
            </div>

            <span className="dashboard-pipeline-arrow">
              →
            </span>

            <div className="dashboard-pipeline-node">
              <span className="dashboard-pipeline-number">
                03
              </span>

              <strong>Embeddings</strong>

              <small>Vector representation</small>
            </div>

            <span className="dashboard-pipeline-arrow">
              →
            </span>

            <div className="dashboard-pipeline-node">
              <span className="dashboard-pipeline-number">
                04
              </span>

              <strong>Retrieval</strong>

              <small>Relevant context</small>
            </div>

            <span className="dashboard-pipeline-arrow">
              →
            </span>

            <div className="dashboard-pipeline-node">
              <span className="dashboard-pipeline-number">
                05
              </span>

              <strong>Evaluation</strong>

              <small>Quality signals</small>
            </div>
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">EVALUATION</span>

              <h2>Quality signals</h2>
            </div>
          </div>

          <div className="dashboard-evaluation-metrics">
            <div className="dashboard-evaluation-metric">
              <div className="dashboard-evaluation-metric-inner">
                <span>ANSWER SIMILARITY</span>

                <strong>—</strong>
              </div>
            </div>

            <div className="dashboard-evaluation-metric">
              <div className="dashboard-evaluation-metric-inner">
                <span>CONTEXT RELEVANCE</span>

                <strong>—</strong>
              </div>
            </div>

            <div className="dashboard-evaluation-metric">
              <div className="dashboard-evaluation-metric-inner">
                <span>FAITHFULNESS</span>

                <strong>—</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Knowledge */}

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">KNOWLEDGE</span>

            <h2>Active knowledge sources</h2>
          </div>
        </div>

        {loading ? (
          <div className="dashboard-empty-state">
            <strong>Loading datasets...</strong>

            <p>
              Fetching the current knowledge registry.
            </p>
          </div>
        ) : datasets.length === 0 ? (
          <div className="dashboard-empty-state">
            <strong>No datasets available.</strong>

            <p>
              Create a dataset to begin building your RAG knowledge base.
            </p>
          </div>
        ) : (
          <div className="dashboard-datasets">
            {datasets.map((dataset) => (
              <div
                className="dashboard-dataset"
                key={dataset.id}
              >
                <div className="dashboard-dataset-mark">
                  ◈
                </div>

                <div>
                  <h3>{dataset.name}</h3>

                  <p>
                    {dataset.description ||
                      "No description provided for this dataset."}
                  </p>
                </div>

                <span className="dashboard-dataset-status">
                  ACTIVE
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Observability */}

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">OBSERVABILITY</span>

            <h2>RAG system health</h2>
          </div>
        </div>

        <div className="dashboard-observability">
          <div className="dashboard-observability-item">
            <span className="dashboard-observability-number">
              01
            </span>

            <div>
              <h3>Retrieval quality</h3>

              <p>
                Inspect semantic retrieval results and understand
                whether the correct context is being surfaced.
              </p>
            </div>
          </div>

          <div className="dashboard-observability-item">
            <span className="dashboard-observability-number">
              02
            </span>

            <div>
              <h3>Generation quality</h3>

              <p>
                Measure answer similarity and faithfulness against
                expected answers and retrieved context.
              </p>
            </div>
          </div>

          <div className="dashboard-observability-item">
            <span className="dashboard-observability-number">
              03
            </span>

            <div>
              <h3>Benchmark performance</h3>

              <p>
                Compare evaluation cases and monitor aggregate RAG
                quality across benchmark runs.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
