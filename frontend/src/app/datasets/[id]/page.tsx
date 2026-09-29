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

const API_BASE_URL = "http://127.0.0.1:8000";

export default function DatasetDetailPage() {
  const params = useParams();
  const datasetId = Number(params.id);

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chunks, setChunks] = useState<Record<number, Chunk[]>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          <button className="secondary-button">
            Edit
          </button>

          <Link href="/retrieval" className="primary-button">
            Run retrieval
          </Link>
        </div>
      </header>

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

        <Link href="/retrieval">
          Retrieval
        </Link>

        <Link href="/evaluation">
          Evaluations
        </Link>
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
        <span>
          Dataset #{dataset.id}
        </span>

        <span>
          Updated{" "}
          {new Date(dataset.updated_at).toLocaleDateString()}
        </span>
      </footer>
    </>
  );
}