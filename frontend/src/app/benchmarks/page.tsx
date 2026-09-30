"use client";

import { useEffect, useState } from "react";

type Dataset = {
  id: number;
  name: string;
};

type BenchmarkResult = {
  dataset_id: number;
  total_cases: number;
  completed_cases: number;
  average_answer_similarity: number;
  average_context_relevance: number;
  average_faithfulness: number;
};

const API_BASE_URL = "https://ragforge-api-8tv4.onrender.com";

export default function BenchmarksPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDatasets() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/datasets/`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load datasets.");
        }

        const data: Dataset[] = await response.json();

        setDatasets(data);

        if (data.length > 0) {
          setSelectedDataset(String(data[0].id));
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load datasets.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDatasets();
  }, []);

  async function runBenchmark() {
    if (!selectedDataset) {
      setError("Select a dataset first.");
      return;
    }

    try {
      setRunning(true);
      setError("");
      setBenchmark(null);

      const response = await fetch(
        `${API_BASE_URL}/evaluation/datasets/${selectedDataset}/benchmark`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        let message = "Failed to run benchmark.";

        try {
          const data = await response.json();

          if (typeof data.detail === "string") {
            message = data.detail;
          }
        } catch {
          // Keep default error message.
        }

        throw new Error(message);
      }

      const data: BenchmarkResult = await response.json();

      setBenchmark(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to run benchmark.",
      );
    } finally {
      setRunning(false);
    }
  }

  function formatScore(value: number) {
    return `${(value * 100).toFixed(1)}%`;
  }

  if (loading) {
    return (
      <section className="registry-state">
        <span className="registry-state-mark">◇</span>
        <strong>Loading benchmark workspace</strong>
        <p>Reading RAGForge datasets...</p>
      </section>
    );
  }

  return (
    <main className="benchmark-page">
      <header className="page-header benchmark-header">
        <div>
          <span className="eyebrow">RAG PERFORMANCE</span>

          <h1>Benchmarks</h1>

          <p className="page-description">
            Run the complete evaluation suite for a dataset and
            measure overall RAG quality.
          </p>
        </div>
      </header>

      {error && (
        <div className="documents-error benchmark-error">
          {error}
        </div>
      )}

      <section className="detail-panel benchmark-control-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">BENCHMARK RUN</span>
            <h2>Evaluate a dataset</h2>
          </div>
        </div>

        <div className="benchmark-controls">
          <label>
            Dataset

            <select
              value={selectedDataset}
              onChange={(event) => {
                setSelectedDataset(event.target.value);
                setBenchmark(null);
              }}
              disabled={running}
            >
              {datasets.length === 0 ? (
                <option value="">No datasets available</option>
              ) : (
                datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name}
                  </option>
                ))
              )}
            </select>
          </label>

          <button
            type="button"
            className="primary-button"
            onClick={runBenchmark}
            disabled={running || datasets.length === 0}
          >
            {running ? "Running benchmark..." : "Run benchmark"}
          </button>
        </div>

        <p className="benchmark-help">
          The benchmark runs every evaluation case belonging to the
          selected dataset and aggregates the resulting quality
          metrics.
        </p>
      </section>

      {!benchmark && !running && (
        <section className="detail-panel benchmark-empty">
          <span className="registry-state-mark">◇</span>
          <strong>No benchmark run yet</strong>
          <p>
            Select a dataset and run the benchmark to generate
            aggregate RAG quality metrics.
          </p>
        </section>
      )}

      {running && (
        <section className="detail-panel benchmark-running">
          <span className="benchmark-spinner">◌</span>

          <div>
            <strong>Running benchmark</strong>
            <p>
              Executing evaluation cases and calculating aggregate
              metrics...
            </p>
          </div>
        </section>
      )}

      {benchmark && !running && (
        <>
          <section className="benchmark-summary">
            <div className="benchmark-stat">
              <span>TOTAL CASES</span>
              <strong>{benchmark.total_cases}</strong>
              <small>Evaluation cases in dataset</small>
            </div>

            <div className="benchmark-stat">
              <span>COMPLETED</span>
              <strong>{benchmark.completed_cases}</strong>
              <small>Cases successfully evaluated</small>
            </div>

            <div className="benchmark-stat">
              <span>ANSWER SIMILARITY</span>
              <strong>
                {formatScore(
                  benchmark.average_answer_similarity,
                )}
              </strong>
              <small>Average semantic answer similarity</small>
            </div>

            <div className="benchmark-stat">
              <span>CONTEXT RELEVANCE</span>
              <strong>
                {formatScore(
                  benchmark.average_context_relevance,
                )}
              </strong>
              <small>Average retrieved-context relevance</small>
            </div>

            <div className="benchmark-stat">
              <span>FAITHFULNESS</span>
              <strong>
                {formatScore(
                  benchmark.average_faithfulness,
                )}
              </strong>
              <small>Average answer grounding</small>
            </div>
          </section>

          <section className="detail-panel benchmark-results-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">QUALITY PROFILE</span>
                <h2>RAG evaluation metrics</h2>
              </div>

              <span className="benchmark-complete">
                {benchmark.completed_cases} /{" "}
                {benchmark.total_cases} COMPLETE
              </span>
            </div>

            <div className="benchmark-metric-list">
              <div className="benchmark-metric-row">
                <div>
                  <span>ANSWER SIMILARITY</span>
                  <small>
                    Measures semantic similarity between generated
                    and expected answers.
                  </small>
                </div>

                <strong>
                  {formatScore(
                    benchmark.average_answer_similarity,
                  )}
                </strong>

                <div className="benchmark-meter">
                  <i
                    style={{
                      width: `${benchmark.average_answer_similarity * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="benchmark-metric-row">
                <div>
                  <span>CONTEXT RELEVANCE</span>
                  <small>
                    Measures how relevant the retrieved context is
                    to the question.
                  </small>
                </div>

                <strong>
                  {formatScore(
                    benchmark.average_context_relevance,
                  )}
                </strong>

                <div className="benchmark-meter">
                  <i
                    style={{
                      width: `${benchmark.average_context_relevance * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="benchmark-metric-row">
                <div>
                  <span>FAITHFULNESS</span>
                  <small>
                    Measures whether the generated answer is
                    supported by the retrieved context.
                  </small>
                </div>

                <strong>
                  {formatScore(
                    benchmark.average_faithfulness,
                  )}
                </strong>

                <div className="benchmark-meter">
                  <i
                    style={{
                      width: `${benchmark.average_faithfulness * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}