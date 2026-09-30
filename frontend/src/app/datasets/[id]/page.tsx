"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Dataset = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type Document = {
  id: number;
  dataset_id: number;
  name: string;
  content: string;
  source: string | null;
  created_at: string;
  updated_at: string;
};

type Chunk = {
  id: number;
  document_id: number;
  content: string;
  chunk_index: number;
  start_char: number;
  end_char: number;
  created_at: string;
};

const API_BASE_URL = "https://ragforge-api-8tv4.onrender.com";

export default function DatasetDetailPage() {
  const params = useParams();
  const datasetId = Number(params.id);

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chunks, setChunks] = useState<Record<number, Chunk[]>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    if (!datasetId || Number.isNaN(datasetId)) {
      setError("Invalid dataset.");
      setLoading(false);
      return;
    }

    async function loadDataset() {
      try {
        setLoading(true);
        setError("");

        const [datasetResponse, documentsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/datasets/${datasetId}`, {
            cache: "no-store",
          }),
          fetch(`${API_BASE_URL}/documents/`, {
            cache: "no-store",
          }),
        ]);

        if (!datasetResponse.ok) {
          throw new Error("Dataset not found.");
        }

        if (!documentsResponse.ok) {
          throw new Error("Failed to load documents.");
        }

        const datasetData: Dataset = await datasetResponse.json();
        const allDocuments: Document[] = await documentsResponse.json();

        const datasetDocuments = allDocuments.filter(
          (document) => document.dataset_id === datasetId,
        );

        setDataset(datasetData);
        setDocuments(datasetDocuments);

        const chunkEntries = await Promise.all(
          datasetDocuments.map(async (document) => {
            const response = await fetch(
              `${API_BASE_URL}/chunks/documents/${document.id}`,
              {
                cache: "no-store",
              },
            );

            if (!response.ok) {
              return [document.id, []] as const;
            }

            const data: Chunk[] = await response.json();

            return [document.id, data] as const;
          }),
        );

        setChunks(Object.fromEntries(chunkEntries));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the dataset.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDataset();
  }, [datasetId]);

  function openEdit() {
    if (!dataset) {
      return;
    }

    setEditName(dataset.name);
    setEditDescription(dataset.description || "");
    setEditError("");
    setIsEditing(true);
  }

  function closeEdit() {
    if (saving) {
      return;
    }

    setIsEditing(false);
    setEditError("");
  }

  async function saveDataset() {
    if (!editName.trim()) {
      setEditError("Dataset name is required.");
      return;
    }

    try {
      setSaving(true);
      setEditError("");

      const response = await fetch(
        `${API_BASE_URL}/datasets/${datasetId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editName.trim(),
            description: editDescription.trim() || null,
          }),
        },
      );

      if (!response.ok) {
        let message = "Failed to update dataset.";

        try {
          const errorData = await response.json();

          if (typeof errorData.detail === "string") {
            message = errorData.detail;
          }
        } catch {
          // Keep default error message.
        }

        throw new Error(message);
      }

      const updatedDataset: Dataset = await response.json();

      setDataset(updatedDataset);
      setIsEditing(false);
    } catch (err) {
      setEditError(
        err instanceof Error
          ? err.message
          : "Unable to update the dataset.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="registry-state">
        <span className="registry-state-mark">◇</span>
        <strong>Loading dataset</strong>
        <p>Reading the RAGForge knowledge pipeline...</p>
      </section>
    );
  }

  if (error || !dataset) {
    return (
      <>
        <div className="detail-breadcrumb">
          <Link href="/datasets">Datasets</Link>
          <span>/</span>
          <span>Unavailable</span>
        </div>

        <section className="registry-state">
          <span className="registry-state-mark">!</span>
          <strong>{error || "Dataset not found."}</strong>
          <p>Unable to load this knowledge source.</p>

          <Link href="/datasets" className="secondary-button">
            Back to datasets
          </Link>
        </section>
      </>
    );
  }

  const totalChunks = Object.values(chunks).reduce(
    (total, documentChunks) => total + documentChunks.length,
    0,
  );

  return (
    <>
      <div className="detail-breadcrumb">
        <Link href="/datasets">Datasets</Link>
        <span>/</span>
        <span>{dataset.name}</span>
      </div>

      <header className="detail-header">
        <div className="detail-title">
          <div className="detail-icon">◇</div>

          <div>
            <span className="eyebrow">DATASET</span>

            <h1>{dataset.name}</h1>

            <p>
              {dataset.description ||
                "Knowledge source connected to the RAGForge pipeline."}
            </p>
          </div>
        </div>

        <div className="detail-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={openEdit}
          >
            Edit
          </button>

          <Link href="/retrieval" className="primary-button">
            Run retrieval
          </Link>
        </div>
      </header>

      {isEditing && (
        <section className="detail-panel dataset-edit-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">DATASET SETTINGS</span>
              <h2>Edit dataset</h2>
            </div>
          </div>

          <div className="dataset-edit-form">
            <label>
              Dataset name
              <input
                type="text"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                placeholder="Dataset name"
                disabled={saving}
              />
            </label>

            <label>
              Description
              <textarea
                value={editDescription}
                onChange={(event) =>
                  setEditDescription(event.target.value)
                }
                placeholder="Describe what this dataset contains..."
                rows={4}
                disabled={saving}
              />
            </label>

            {editError && (
              <div className="documents-error">
                {editError}
              </div>
            )}

            <div className="dataset-edit-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeEdit}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={saveDataset}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </section>
      )}

      <nav className="detail-tabs">
        <Link className="active" href={`/datasets/${dataset.id}`}>
          Overview
        </Link>

        <Link href={`/datasets/${dataset.id}/documents`}>
          Documents
        </Link>

        <Link href={`/datasets/${dataset.id}/chunks`}>
          Chunks
        </Link>

        <Link href="/retrieval">Retrieval</Link>

        <Link href="/evaluation">Evaluations</Link>
      </nav>

      <section className="detail-stats">
        <div>
          <span>DOCUMENTS</span>
          <strong>{documents.length}</strong>
        </div>

        <div>
          <span>CHUNKS</span>
          <strong>{totalChunks}</strong>
        </div>

        <div>
          <span>EMBEDDING DIMENSIONS</span>
          <strong>384</strong>
        </div>

        <div>
          <span>STATUS</span>

          <strong className="detail-status">
            <i></i>
            Active
          </strong>
        </div>
      </section>

      <div className="detail-grid">
        <section className="detail-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">DOCUMENTS</span>
              <h2>Indexed documents</h2>
            </div>

            <span className="panel-count">
              {documents.length}{" "}
              {documents.length === 1 ? "DOCUMENT" : "DOCUMENTS"}
            </span>
          </div>

          {documents.length === 0 ? (
            <div className="registry-state">
              <span className="registry-state-mark">◇</span>
              <strong>No documents</strong>
              <p>
                This dataset does not contain any indexed documents yet.
              </p>
            </div>
          ) : (
            documents.map((document) => {
              const documentChunks = chunks[document.id] || [];

              return (
                <article
                  className="document-item"
                  key={document.id}
                >
                  <div className="document-symbol">▤</div>

                  <div className="document-info">
                    <h3>{document.name}</h3>

                    <p>
                      {document.source
                        ? `source: ${document.source}`
                        : "source: not specified"}
                    </p>
                  </div>

                  <div className="document-metrics">
                    <span>
                      {documentChunks.length}{" "}
                      {documentChunks.length === 1
                        ? "chunk"
                        : "chunks"}
                    </span>

                    <span>
                      {documentChunks.length > 0
                        ? "Chunked"
                        : "Not chunked"}
                    </span>
                  </div>

                  <span className="document-arrow">→</span>
                </article>
              );
            })
          )}
        </section>

        <section className="detail-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">PIPELINE</span>
              <h2>Knowledge flow</h2>
            </div>
          </div>

          <div className="pipeline">
            <div className="pipeline-step">
              <span className="pipeline-number">01</span>

              <div>
                <strong>Documents</strong>
                <small>
                  {documents.length} indexed source
                  {documents.length === 1 ? "" : "s"}
                </small>
              </div>
            </div>

            <span className="pipeline-line"></span>

            <div className="pipeline-step">
              <span className="pipeline-number">02</span>

              <div>
                <strong>Chunks</strong>
                <small>
                  {totalChunks} retrievable segment
                  {totalChunks === 1 ? "" : "s"}
                </small>
              </div>
            </div>

            <span className="pipeline-line"></span>

            <div className="pipeline-step">
              <span className="pipeline-number">03</span>

              <div>
                <strong>Embeddings</strong>
                <small>
                  384-dimensional vector representation
                </small>
              </div>
            </div>

            <span className="pipeline-line"></span>

            <div className="pipeline-step">
              <span className="pipeline-number">04</span>

              <div>
                <strong>Retrieval</strong>
                <small>
                  Ready for semantic similarity search
                </small>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="detail-panel chunks-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">VECTOR INDEX</span>
            <h2>Recent chunks</h2>
          </div>

          <Link href="/retrieval">
            Inspect retrieval →
          </Link>
        </div>

        {totalChunks === 0 ? (
          <div className="registry-state">
            <span className="registry-state-mark">◇</span>
            <strong>No chunks generated</strong>
            <p>
              Documents need to be chunked before they can be retrieved.
            </p>
          </div>
        ) : (
          <div className="chunk-table">
            <div className="chunk-header">
              <span>CHUNK</span>
              <span>RANGE</span>
              <span>SIZE</span>
              <span>STATUS</span>
            </div>

            {documents.flatMap((document) =>
              (chunks[document.id] || []).map((chunk) => (
                <div
                  className="chunk-row"
                  key={chunk.id}
                >
                  <span>
                    {document.name} · Chunk {chunk.chunk_index}
                  </span>

                  <span>
                    {chunk.start_char} – {chunk.end_char}
                  </span>

                  <span>
                    {chunk.content.length} characters
                  </span>

                  <span className="indexed">
                    Chunked
                  </span>
                </div>
              )),
            )}
          </div>
        )}
      </section>

      <footer className="resource-footer">
        <span>Dataset #{dataset.id}</span>

        <span>
          Updated{" "}
          {new Date(dataset.updated_at).toLocaleDateString()}
        </span>
      </footer>
    </>
  );
}