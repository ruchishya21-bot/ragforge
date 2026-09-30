"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const API_BASE_URL = "https://ragforge-api-8tv4.onrender.com";

type Dataset = {
  id: number;
  name: string;
  description?: string | null;
};

type RAGResponse = {
  answer?: string;
  actual_answer?: string;
  response?: string;
  query?: string;
  results?: Array<{
    chunk_id: number;
    document_id: number;
    content: string;
    chunk_index: number;
    similarity: number;
  }>;
  context?: Array<{
    chunk_id?: number;
    document_id?: number;
    content?: string;
    chunk_index?: number;
    similarity?: number;
  }>;
};

export default function RAGPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetId, setDatasetId] = useState("");
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState("5");

  const [answer, setAnswer] = useState("");
  const [retrievedContext, setRetrievedContext] = useState<
    NonNullable<RAGResponse["results"]>
  >([]);

  const [askedQuery, setAskedQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDatasets() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/datasets/`
        );

        if (!response.ok) {
          throw new Error("Failed to load datasets.");
        }

        const data: Dataset[] = await response.json();

        setDatasets(data);

        if (data.length > 0) {
          setDatasetId(String(data[0].id));
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load datasets."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDatasets();
  }, []);

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!datasetId) {
      setError("Select a dataset before asking a question.");
      return;
    }

    if (!query.trim()) {
      setError("Enter a question first.");
      return;
    }

    try {
      setRunning(true);
      setError("");
      setAnswer("");
      setRetrievedContext([]);

      const response = await fetch(`${API_BASE_URL}/rag/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
          dataset_id: Number(datasetId),
          top_k: Number(topK),
        }),
      });

      if (!response.ok) {
        const message = await response.text();

        throw new Error(
          message || "RAG request failed."
        );
      }

      const data: RAGResponse = await response.json();

      const generatedAnswer =
        data.answer ||
        data.actual_answer ||
        data.response ||
        "";

      const context =
        data.results ||
        data.context ||
        [];

      setAnswer(generatedAnswer);
      setRetrievedContext(
        context.map((item) => ({
          chunk_id: item.chunk_id ?? 0,
          document_id: item.document_id ?? 0,
          content: item.content ?? "",
          chunk_index: item.chunk_index ?? 0,
          similarity: item.similarity ?? 0,
        }))
      );

      setAskedQuery(
        data.query ||
          query.trim()
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to run the RAG query."
      );
    } finally {
      setRunning(false);
    }
  }

  const selectedDataset = useMemo(
    () =>
      datasets.find(
        (dataset) =>
          String(dataset.id) === datasetId
      ),
    [datasets, datasetId]
  );

  const hasResult =
    Boolean(answer) ||
    retrievedContext.length > 0;

  return (
    <main className="rag-page">
      <section className="rag-header">
        <div>
          <p className="rag-eyebrow">
            RAG PLAYGROUND
          </p>

          <h1>Ask your knowledge base</h1>

          <p className="rag-description">
            Run a real retrieval-augmented generation query and
            inspect the context used to produce the answer.
          </p>
        </div>

        <div className="rag-status">
          <span className="rag-status-dot" />
          RAG pipeline
        </div>
      </section>

      {error && (
        <div className="rag-error">
          <span>!</span>
          {error}
        </div>
      )}

      <section className="rag-query-panel">
        <div className="rag-panel-heading">
          <div>
            <p className="rag-panel-kicker">
              QUERY
            </p>

            <h2>Ask a question</h2>
          </div>

          {selectedDataset && (
            <div className="rag-dataset-label">
              <span>DATASET</span>
              <strong>{selectedDataset.name}</strong>
            </div>
          )}
        </div>

        <form onSubmit={handleAsk}>
          <div className="rag-controls">
            <label>
              <span>KNOWLEDGE BASE</span>

              <select
                value={datasetId}
                onChange={(event) =>
                  setDatasetId(event.target.value)
                }
                disabled={loading || running}
              >
                {datasets.length === 0 && (
                  <option value="">
                    No datasets available
                  </option>
                )}

                {datasets.map((dataset) => (
                  <option
                    key={dataset.id}
                    value={dataset.id}
                  >
                    {dataset.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>TOP K</span>

              <select
                value={topK}
                onChange={(event) =>
                  setTopK(event.target.value)
                }
                disabled={running}
              >
                <option value="3">3 chunks</option>
                <option value="5">5 chunks</option>
                <option value="10">10 chunks</option>
              </select>
            </label>
          </div>

          <label className="rag-question-field">
            <span>QUESTION</span>

            <textarea
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Ask something about the information in your dataset..."
              disabled={running}
            />
          </label>

          <div className="rag-form-footer">
            <div className="rag-pipeline-preview">
              <span>RETRIEVE</span>
              <i>→</i>
              <span>CONTEXT</span>
              <i>→</i>
              <span>GENERATE</span>
            </div>

            <button
              type="submit"
              className="rag-ask-button"
              disabled={
                running ||
                loading ||
                !datasetId ||
                !query.trim()
              }
            >
              {running ? (
                <>
                  <span className="rag-spinner" />
                  Generating
                </>
              ) : (
                <>
                  Ask RAG
                  <span>↗</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {running && (
        <section className="rag-processing">
          <span className="rag-processing-spinner" />

          <div>
            <strong>
              Running RAG pipeline
            </strong>

            <p>
              Retrieving relevant chunks and generating an
              answer from the selected knowledge base.
            </p>
          </div>
        </section>
      )}

      {!running && hasResult && (
        <>
          <section className="rag-answer-section">
            <div className="rag-section-heading">
              <div>
                <p className="rag-panel-kicker">
                  GENERATED ANSWER
                </p>

                <h2>Response</h2>
              </div>

              <span className="rag-grounded-label">
                Context-grounded
              </span>
            </div>

            <div className="rag-answer-card">
              <div className="rag-answer-mark">
                RAG
              </div>

              <div className="rag-answer-content">
                {answer ? (
                  <p>{answer}</p>
                ) : (
                  <p className="rag-no-answer">
                    The API returned no generated answer.
                  </p>
                )}
              </div>
            </div>

            {askedQuery && (
              <div className="rag-question-reference">
                <span>QUESTION</span>
                <p>{askedQuery}</p>
              </div>
            )}
          </section>

          {retrievedContext.length > 0 && (
            <section className="rag-context-section">
              <div className="rag-section-heading">
                <div>
                  <p className="rag-panel-kicker">
                    RETRIEVED CONTEXT
                  </p>

                  <h2>
                    Evidence used by the pipeline
                  </h2>
                </div>

                <span className="rag-context-count">
                  {retrievedContext.length} chunks
                </span>
              </div>

              <div className="rag-context-list">
                {retrievedContext.map(
                  (chunk, index) => (
                    <article
                      className="rag-context-item"
                      key={`${chunk.chunk_id}-${index}`}
                    >
                      <div className="rag-context-rank">
                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}
                      </div>

                      <div className="rag-context-main">
                        <div className="rag-context-meta">
                          <span>CHUNK</span>
                          <strong>
                            #{chunk.chunk_id}
                          </strong>

                          <i>/</i>

                          <span>
                            INDEX {chunk.chunk_index}
                          </span>
                        </div>

                        <p>
                          {chunk.content}
                        </p>
                      </div>

                      <div className="rag-context-score">
                        <span>
                          SIMILARITY
                        </span>

                        <strong>
                          {(
                            chunk.similarity * 100
                          ).toFixed(1)}
                          %
                        </strong>

                        <div className="rag-score-bar">
                          <div
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(
                                  100,
                                  chunk.similarity *
                                    100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </article>
                  )
                )}
              </div>
            </section>
          )}
        </>
      )}

      {!running && !hasResult && (
        <section className="rag-empty-state">
          <div className="rag-empty-diagram">
            <span>Q</span>
            <i>→</i>
            <span>R</span>
            <i>→</i>
            <span>A</span>
          </div>

          <h2>Ready to query</h2>

          <p>
            Ask a question above to see how RAGForge retrieves
            context and generates an answer from your documents.
          </p>
        </section>
      )}
    </main>
  );
}