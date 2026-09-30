
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
  dataset_id: number;
  name: string;
  content: string;
  source?: string | null;
  created_at: string;
  updated_at: string;
};

type Chunk = {
  id: number;
  document_id: number;
  chunk_index: number;
  start_position: number;
  end_position: number;
  content: string;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [chunkCounts, setChunkCounts] = useState<Record<number, number>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [datasetFilter, setDatasetFilter] = useState("all");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [datasetId, setDatasetId] = useState("");
  const [content, setContent] = useState("");

  const datasetMap = useMemo(() => {
    const map: Record<number, string> = {};

    for (const dataset of datasets) {
      map[dataset.id] = dataset.name;
    }

    return map;
  }, [datasets]);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesSearch =
        !query ||
        document.name.toLowerCase().includes(query) ||
        (document.source ?? "").toLowerCase().includes(query);

      const matchesDataset =
        datasetFilter === "all" ||
        document.dataset_id === Number(datasetFilter);

      return matchesSearch && matchesDataset;
    });
  }, [documents, search, datasetFilter]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [documentsResponse, datasetsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/documents/`),
        fetch(`${API_BASE_URL}/datasets/`),
      ]);

      if (!documentsResponse.ok) {
        throw new Error("Failed to load documents.");
      }

      if (!datasetsResponse.ok) {
        throw new Error("Failed to load datasets.");
      }

      const documentsData: Document[] = await documentsResponse.json();
      const datasetsData: Dataset[] = await datasetsResponse.json();

      setDocuments(documentsData);
      setDatasets(datasetsData);

      const counts: Record<number, number> = {};

      await Promise.all(
        documentsData.map(async (document) => {
          try {
            const response = await fetch(
              `${API_BASE_URL}/chunks/documents/${document.id}`
            );

            if (!response.ok) {
              counts[document.id] = 0;
              return;
            }

            const chunks: Chunk[] = await response.json();
            counts[document.id] = chunks.length;
          } catch {
            counts[document.id] = 0;
          }
        })
      );

      setChunkCounts(counts);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading documents."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!datasetId || !name.trim() || !content.trim()) {
      setError("Dataset, document name, and content are required.");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/documents/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataset_id: Number(datasetId),
          name: name.trim(),
          source: source.trim() || null,
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to create document.");
      }

      setName("");
      setSource("");
      setDatasetId("");
      setContent("");
      setShowCreateForm(false);

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the document."
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteDocument(documentId: number) {
    const confirmed = window.confirm(
      "Delete this document? Its associated chunks will also be removed according to the backend configuration."
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/documents/${documentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to delete document.");
      }

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while deleting the document."
      );
    }
  }

  return (
    <main className="page-container">
      <section className="page-header">
        <div>
          <p className="eyebrow">KNOWLEDGE INGESTION</p>

          <h1>Documents</h1>

          <p className="page-description">
            Manage the source documents that feed your RAG pipeline.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => setShowCreateForm((current) => !current)}
        >
          {showCreateForm ? "Close" : "Add document"}
        </button>
      </section>

      <section className="documents-overview">
        <div className="documents-stat">
          <span className="documents-stat-label">DOCUMENTS</span>
          <strong>{documents.length}</strong>
          <span>Ingested sources</span>
        </div>

        <div className="documents-stat">
          <span className="documents-stat-label">DATASETS</span>
          <strong>{datasets.length}</strong>
          <span>Knowledge collections</span>
        </div>

        <div className="documents-stat">
          <span className="documents-stat-label">CHUNKS</span>
          <strong>
            {Object.values(chunkCounts).reduce(
              (total, count) => total + count,
              0
            )}
          </strong>
          <span>Indexed segments</span>
        </div>
      </section>

      {showCreateForm && (
        <section className="documents-form-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">NEW SOURCE</p>
              <h2>Add document</h2>
            </div>
          </div>

          <form onSubmit={handleCreateDocument}>
            <div className="form-grid">
              <label>
                <span>Dataset</span>

                <select
                  value={datasetId}
                  onChange={(event) => setDatasetId(event.target.value)}
                  required
                >
                  <option value="">Select dataset</option>

                  {datasets.map((dataset) => (
                    <option key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Document name</span>

                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Python Overview"
                  required
                />
              </label>

              <label>
                <span>Source</span>

                <input
                  type="text"
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  placeholder="e.g. Python Documentation"
                />
              </label>
            </div>

            <label className="full-width-field">
              <span>Content</span>

              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Paste the document content here..."
                rows={10}
                required
              />
            </label>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={creating}
              >
                {creating ? "Creating..." : "Create document"}
              </button>
            </div>
          </form>
        </section>
      )}

      {error && (
        <div className="documents-error">
          {error}
        </div>
      )}

      <section className="documents-panel">
        <div className="documents-toolbar">
          <div>
            <p className="panel-kicker">DOCUMENT REGISTRY</p>
            <h2>Source documents</h2>
          </div>

          <div className="documents-filters">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search documents..."
            />

            <select
              value={datasetFilter}
              onChange={(event) => setDatasetFilter(event.target.value)}
            >
              <option value="all">All datasets</option>

              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="documents-empty-state">
            <span className="loading-mark" />
            <p>Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="documents-empty-state">
            <div className="empty-mark">D</div>
            <h3>No documents found</h3>
            <p>
              {documents.length === 0
                ? "Add your first source document to begin the ingestion pipeline."
                : "Try changing your search or dataset filter."}
            </p>
          </div>
        ) : (
          <div className="documents-table-wrapper">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>DOCUMENT</th>
                  <th>DATASET</th>
                  <th>SOURCE</th>
                  <th>CHUNKS</th>
                  <th>UPDATED</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filteredDocuments.map((document) => (
                  <tr key={document.id}>
                    <td>
                      <div className="document-name-cell">
                        <div className="document-icon">DOC</div>

                        <div>
                          <strong>{document.name}</strong>

                          <span>
                            Document #{document.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="dataset-pill">
                        {datasetMap[document.dataset_id] ??
                          `Dataset #${document.dataset_id}`}
                      </span>
                    </td>

                    <td>
                      <span className="source-cell">
                        {document.source || "—"}
                      </span>
                    </td>

                    <td>
                      <span className="chunk-count">
                        {chunkCounts[document.id] ?? "—"}
                      </span>
                    </td>

                    <td>
                      <span className="date-cell">
                        {new Date(document.updated_at).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() =>
                          handleDeleteDocument(document.id)
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
