"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const API_BASE_URL = "https://ragforge-api-8tv4.onrender.com";

type Dataset = {
  id: number;
  name: string;
  description?: string | null;
};

type Document = {
  id: number;
  name: string;
  source?: string | null;
};

type RetrievalResult = {
  chunk_id: number;
  document_id: number;
  content: string;
  chunk_index: number;
  similarity: number;
};

type RetrievalResponse = {
  query: string;
  results: RetrievalResult[];
};

export default function RetrievalPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  const [datasetId, setDatasetId] = useState("");
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState("5");

  const [results, setResults] = useState<RetrievalResult[]>([]);
  const [searchedQuery, setSearchedQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [datasetsResponse, documentsResponse] =
          await Promise.all([
            fetch(`${API_BASE_URL}/datasets/`),
            fetch(`${API_BASE_URL}/documents/`),
          ]);

        if (!datasetsResponse.ok) {
          throw new Error("Failed to load datasets.");
        }

        if (!documentsResponse.ok) {
          throw new Error("Failed to load documents.");
        }

        const datasetsData: Dataset[] =
          await datasetsResponse.json();

        const documentsData: Document[] =
          await documentsResponse.json();

        setDatasets(datasetsData);
        setDocuments(documentsData);

        if (datasetsData.length > 0) {
          setDatasetId(String(datasetsData[0].id));
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load retrieval data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!datasetId) {
      setError("Select a dataset before searching.");
      return;
    }

    if (!query.trim()) {
      setError("Enter a query to test retrieval.");
      return;
    }

    try {
      setSearching(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/retrieval/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: query.trim(),
            dataset_id: Number(datasetId),
            top_k: Number(topK),
          }),
        }
      );

      if (!response.ok) {
        let message = "Retrieval request failed.";

        try {
          const data = await response.json();

          if (typeof data.detail === "string") {
            message = data.detail;
          }
        } catch {
          const text = await response.text();

          if (text) {
            message = text;
          }
        }

        throw new Error(message);
      }

      const data: RetrievalResponse =
        await response.json();

      setResults(data.results || []);
      setSearchedQuery(data.query || query.trim());
    } catch (err) {
      setResults([]);
      setSearchedQuery("");

      setError(
        err instanceof Error
          ? err.message
          : "Unable to run retrieval."
      );
    } finally {
      setSearching(false);
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

  const documentMap = useMemo(() => {
    const map = new Map<number, Document>();

    for (const document of documents) {
      map.set(document.id, document);
    }

    return map;
  }, [documents]);

  const bestSimilarity =
    results.length > 0
      ? Math.max(
          ...results.map(
            (result) => result.similarity
          )
        )
      : null;

  const averageSimilarity =
    results.length > 0
      ? results.reduce(
          (sum, result) =>
            sum + result.similarity,
          0
        ) / results.length
      : null;

  function formatSimilarity(value: number) {
    return `${(value * 100).toFixed(1)}%`;
  }

  return (
    <main className="retrieval-page">
      <section className="retrieval-header">
        <div>
          <p className="retrieval-eyebrow">
            RETRIEVAL INSPECTION
          </p>

          <h1>Retrieval</h1>

          <p className="retrieval-description">
            Test semantic search and inspect the chunks your RAG
            pipeline retrieves for a given question.
          </p>
        </div>

        <div className="retrieval-status">
          <span className="retrieval-status-dot" />
          Vector search
        </div>
      </section>

      {error && (
        <div className="retrieval-error">
          <span>!</span>
          {error}
        </div>
      )}

      <section className="retrieval-workspace">
        <div className="retrieval-query-panel">
          <div className="retrieval-panel-heading">
            <div>
              <p className="retrieval-panel-kicker">
                SEARCH CONFIGURATION
              </p>

              <h2>Run a retrieval query</h2>
            </div>
          </div>

          <form onSubmit={handleSearch}>
            <div className="retrieval-form-grid">
              <label>
                <span>DATASET</span>

                <select
                  value={datasetId}
                  onChange={(event) => {
                    setDatasetId(event.target.value);
                    setResults([]);
                    setSearchedQuery("");
                    setError("");
                  }}
                  disabled={loading || searching}
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
                  disabled={searching}
                >
                  <option value="3">
                    3 results
                  </option>

                  <option value="5">
                    5 results
                  </option>

                  <option value="10">
                    10 results
                  </option>
                </select>
              </label>
            </div>

            <label className="retrieval-query-field">
              <span>QUERY</span>

              <textarea
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Ask a question about your dataset..."
                disabled={searching}
              />
            </label>

            <div className="retrieval-form-footer">
              <div className="retrieval-selected-dataset">
                {selectedDataset ? (
                  <>
                    <span className="retrieval-dataset-mark">
                      DS
                    </span>

                    <div>
                      <strong>
                        {selectedDataset.name}
                      </strong>

                      <span>
                        Dataset #{selectedDataset.id}
                      </span>
                    </div>
                  </>
                ) : (
                  <span>
                    No dataset selected
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="retrieval-search-button"
                disabled={
                  searching ||
                  loading ||
                  !datasetId ||
                  !query.trim()
                }
              >
                {searching ? (
                  <>
                    <span className="retrieval-spinner" />
                    Searching
                  </>
                ) : (
                  <>
                    <span>↗</span>
                    Run retrieval
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="retrieval-results-section">
        <div className="retrieval-results-header">
          <div>
            <p className="retrieval-panel-kicker">
              RETRIEVAL RESULTS
            </p>

            <h2>
              {searchedQuery
                ? "Retrieved context"
                : "Inspect retrieved context"}
            </h2>

            {searchedQuery && (
              <p className="retrieval-results-query">
                “{searchedQuery}”
              </p>
            )}
          </div>

          {results.length > 0 && (
            <div className="retrieval-result-summary">
              <div>
                <span>RESULTS</span>
                <strong>
                  {results.length}
                </strong>
              </div>

              <div>
                <span>BEST MATCH</span>
                <strong>
                  {bestSimilarity !== null
                    ? formatSimilarity(
                        bestSimilarity
                      )
                    : "—"}
                </strong>
              </div>

              <div>
                <span>AVERAGE</span>
                <strong>
                  {averageSimilarity !== null
                    ? formatSimilarity(
                        averageSimilarity
                      )
                    : "—"}
                </strong>
              </div>
            </div>
          )}
        </div>

        {searching ? (
          <div className="retrieval-empty-state">
            <span className="retrieval-loading-spinner" />

            <h3>
              Searching the vector index
            </h3>

            <p>
              Comparing your query against the embedded
              document chunks.
            </p>
          </div>
        ) : results.length > 0 ? (
          <div className="retrieval-results-list">
            {results.map((result, index) => {
              const document =
                documentMap.get(
                  result.document_id
                );

              const similarityPercentage = Math.max(
                0,
                Math.min(
                  100,
                  result.similarity * 100
                )
              );

              return (
                <article
                  className="retrieval-result"
                  key={result.chunk_id}
                >
                  <div className="retrieval-result-rank">
                    <span>
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </span>
                  </div>

                  <div className="retrieval-result-main">
                    <div className="retrieval-result-meta">
                      <span className="retrieval-document-badge">
                        DOC
                      </span>

                      <span>
                        {document?.name ||
                          `Document #${result.document_id}`}
                      </span>

                      <span className="retrieval-divider">
                        /
                      </span>

                      <span>
                        Chunk {result.chunk_index}
                      </span>
                    </div>

                    <p className="retrieval-result-content">
                      {result.content}
                    </p>

                    <div className="retrieval-result-footer">
                      <span>
                        Chunk #{result.chunk_id}
                      </span>

                      <span>
                        Document #{result.document_id}
                      </span>
                    </div>
                  </div>

                  <div className="retrieval-similarity">
                    <span>SIMILARITY</span>

                    <strong>
                      {formatSimilarity(
                        result.similarity
                      )}
                    </strong>

                    <div className="retrieval-similarity-bar">
                      <div
                        style={{
                          width: `${similarityPercentage}%`,
                        }}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="retrieval-empty-state">
            <div className="retrieval-empty-mark">
              ↗
            </div>

            <h3>
              No retrieval run yet
            </h3>

            <p>
              Enter a question above to see which document
              chunks your vector search retrieves.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}