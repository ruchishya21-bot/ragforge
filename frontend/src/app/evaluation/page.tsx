"use client";

import { useEffect, useState } from "react";

type Dataset = {
  id: number;
  name: string;
};

type EvaluationCase = {
  id: number;
  dataset_id: number;
  question: string;
  expected_answer: string;
  created_at: string;
};

type EvaluationResult = {
  id: number;
  evaluation_case_id: number;
  actual_answer: string;
  answer_similarity: number;
  context_relevance: number;
  faithfulness: number;
  created_at: string;
};

const API_BASE_URL = "https://ragforge-api-8tv4.onrender.com";

export default function EvaluationPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [cases, setCases] = useState<EvaluationCase[]>([]);
  const [results, setResults] = useState<Record<number, EvaluationResult>>(
    {},
  );

  const [selectedDataset, setSelectedDataset] = useState("");
  const [question, setQuestion] = useState("");
  const [expectedAnswer, setExpectedAnswer] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [runningId, setRunningId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [formMessage, setFormMessage] = useState("");

  async function loadDatasets() {
    const response = await fetch(`${API_BASE_URL}/datasets/`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to load datasets.");
    }

    const data: Dataset[] = await response.json();

    setDatasets(data);

    if (data.length > 0 && !selectedDataset) {
      setSelectedDataset(String(data[0].id));
    }

    return data;
  }

  async function loadCases(datasetId: string) {
    if (!datasetId) {
      setCases([]);
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/evaluation/datasets/${datasetId}/cases`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to load evaluation cases.");
    }

    const data: EvaluationCase[] = await response.json();

    setCases(data);
  }

  async function loadPage() {
    try {
      setLoading(true);
      setError("");

      const data = await loadDatasets();

      if (data.length > 0) {
        const datasetId = selectedDataset || String(data[0].id);

        if (!selectedDataset) {
          setSelectedDataset(datasetId);
        }

        await loadCases(datasetId);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load evaluation data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    if (!selectedDataset) {
      return;
    }

    async function refreshCases() {
      try {
        setError("");
        await loadCases(selectedDataset);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load evaluation cases.",
        );
      }
    }

    refreshCases();
  }, [selectedDataset]);

  async function createCase() {
    if (!selectedDataset) {
      setFormMessage("Select a dataset first.");
      return;
    }

    if (!question.trim()) {
      setFormMessage("Enter a question.");
      return;
    }

    if (!expectedAnswer.trim()) {
      setFormMessage("Enter the expected answer.");
      return;
    }

    try {
      setCreating(true);
      setFormMessage("");
      setError("");

      const response = await fetch(`${API_BASE_URL}/evaluation/cases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataset_id: Number(selectedDataset),
          question: question.trim(),
          expected_answer: expectedAnswer.trim(),
        }),
      });

      if (!response.ok) {
        let message = "Failed to create evaluation case.";

        try {
          const data = await response.json();

          if (typeof data.detail === "string") {
            message = data.detail;
          }
        } catch {
          // Keep default message.
        }

        throw new Error(message);
      }

      setQuestion("");
      setExpectedAnswer("");
      setFormMessage("Evaluation case created.");

      await loadCases(selectedDataset);
    } catch (err) {
      setFormMessage(
        err instanceof Error
          ? err.message
          : "Unable to create evaluation case.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function runEvaluation(caseId: number) {
    try {
      setRunningId(caseId);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/evaluation/cases/${caseId}/run`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        let message = "Failed to run evaluation.";

        try {
          const data = await response.json();

          if (typeof data.detail === "string") {
            message = data.detail;
          }
        } catch {
          // Keep default message.
        }

        throw new Error(message);
      }

      const result: EvaluationResult = await response.json();

      setResults((current) => ({
        ...current,
        [caseId]: result,
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to run evaluation.",
      );
    } finally {
      setRunningId(null);
    }
  }

  function formatScore(value: number) {
    return `${(value * 100).toFixed(1)}%`;
  }

  /**
   * Converts the backend timestamp into the user's actual local
   * world-clock time.
   *
   * Backend timestamps that already contain a timezone offset or
   * "Z" are preserved.
   *
   * If the backend sends a timezone-less timestamp, it is treated
   * as UTC and then converted to the browser's local timezone.
   */
  function formatTimestamp(timestamp: string) {
    if (!timestamp) {
      return "—";
    }

    const hasTimezone =
      timestamp.endsWith("Z") ||
      /[+-]\d{2}:\d{2}$/.test(timestamp);

    const normalizedTimestamp = hasTimezone
      ? timestamp
      : `${timestamp}Z`;

    const date = new Date(normalizedTimestamp);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(date);
  }

  if (loading) {
    return (
      <section className="registry-state">
        <span className="registry-state-mark">◇</span>
        <strong>Loading evaluation workspace</strong>
        <p>Reading evaluation cases from RAGForge...</p>
      </section>
    );
  }

  return (
    <main className="evaluation-page">
      <header className="page-header evaluation-header">
        <div>
          <span className="eyebrow">RAG QUALITY</span>

          <h1>Evaluation Cases</h1>

          <p className="page-description">
            Create known questions and measure how accurately the RAG
            system retrieves context and generates supported answers.
          </p>
        </div>
      </header>

      {error && (
        <div className="documents-error evaluation-error">
          {error}
        </div>
      )}

      <section className="evaluation-overview">
        <div className="evaluation-stat">
          <span>DATASETS</span>
          <strong>{datasets.length}</strong>
          <small>Available knowledge sources</small>
        </div>

        <div className="evaluation-stat">
          <span>CASES</span>
          <strong>{cases.length}</strong>
          <small>Cases in selected dataset</small>
        </div>

        <div className="evaluation-stat">
          <span>RUNS</span>
          <strong>{Object.keys(results).length}</strong>
          <small>Evaluations completed this session</small>
        </div>
      </section>

      <section className="detail-panel evaluation-create-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">TEST DEFINITION</span>
            <h2>Create evaluation case</h2>
          </div>
        </div>

        <div className="evaluation-form">
          <label>
            Dataset

            <select
              value={selectedDataset}
              onChange={(event) =>
                setSelectedDataset(event.target.value)
              }
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

          <label>
            Question

            <textarea
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              placeholder="What should the RAG system be able to answer?"
              rows={3}
            />
          </label>

          <label>
            Expected answer

            <textarea
              value={expectedAnswer}
              onChange={(event) =>
                setExpectedAnswer(event.target.value)
              }
              placeholder="What is the expected answer based on the dataset?"
              rows={4}
            />
          </label>

          {formMessage && (
            <div className="evaluation-form-message">
              {formMessage}
            </div>
          )}

          <div className="evaluation-form-footer">
            <span>
              The expected answer becomes the reference used for
              answer-similarity evaluation.
            </span>

            <button
              type="button"
              className="primary-button"
              onClick={createCase}
              disabled={creating || datasets.length === 0}
            >
              {creating ? "Creating..." : "Create case"}
            </button>
          </div>
        </div>
      </section>

      <section className="detail-panel evaluation-cases-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">EVALUATION REGISTRY</span>
            <h2>Known questions</h2>
          </div>

          <span className="panel-count">
            {cases.length} {cases.length === 1 ? "CASE" : "CASES"}
          </span>
        </div>

        {cases.length === 0 ? (
          <div className="registry-state">
            <span className="registry-state-mark">◇</span>
            <strong>No evaluation cases</strong>
            <p>
              Create a known question and expected answer to begin
              evaluating the RAG pipeline.
            </p>
          </div>
        ) : (
          <div className="evaluation-case-list">
            {cases.map((evaluationCase) => {
              const result = results[evaluationCase.id];
              const isRunning = runningId === evaluationCase.id;

              return (
                <article
                  className="evaluation-case"
                  key={evaluationCase.id}
                >
                  <div className="evaluation-case-top">
                    <div>
                      <span className="evaluation-case-id">
                        CASE #{evaluationCase.id}
                      </span>

                      <h3>{evaluationCase.question}</h3>
                    </div>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        runEvaluation(evaluationCase.id)
                      }
                      disabled={isRunning}
                    >
                      {isRunning ? "Running..." : "Run evaluation"}
                    </button>
                  </div>

                  <div className="evaluation-reference">
                    <span>EXPECTED ANSWER</span>

                    <p>{evaluationCase.expected_answer}</p>
                  </div>

                  {result && (
                    <div className="evaluation-result">
                      <div className="evaluation-result-header">
                        <span className="eyebrow">
                          LATEST RESULT
                        </span>

                        <span>
                          {formatTimestamp(result.created_at)}
                        </span>
                      </div>

                      <div className="evaluation-metrics">
                        <div className="evaluation-metric">
                          <span>ANSWER SIMILARITY</span>
                          <strong>
                            {formatScore(
                              result.answer_similarity,
                            )}
                          </strong>

                          <div className="evaluation-meter">
                            <i
                              style={{
                                width: `${result.answer_similarity * 100}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="evaluation-metric">
                          <span>CONTEXT RELEVANCE</span>
                          <strong>
                            {formatScore(
                              result.context_relevance,
                            )}
                          </strong>

                          <div className="evaluation-meter">
                            <i
                              style={{
                                width: `${result.context_relevance * 100}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="evaluation-metric">
                          <span>FAITHFULNESS</span>
                          <strong>
                            {formatScore(result.faithfulness)}
                          </strong>

                          <div className="evaluation-meter">
                            <i
                              style={{
                                width: `${result.faithfulness * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="evaluation-actual-answer">
                        <span>GENERATED ANSWER</span>
                        <p>{result.actual_answer}</p>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}