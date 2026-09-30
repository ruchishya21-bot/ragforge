"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Dataset = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

const API_BASE_URL = "https://ragforge-api-8tv4.onrender.com";

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

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
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the RAGForge API.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDatasets();
  }, []);

  async function handleCreateDataset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Dataset name is required.");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/datasets/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail || "Failed to create dataset.",
        );
      }

      setName("");
      setDescription("");
      setShowCreateForm(false);

      await loadDatasets();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create the dataset.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <header className="resource-header">
        <div>
          <span className="eyebrow">KNOWLEDGE REGISTRY</span>

          <h1>Datasets</h1>

          <p>
            Knowledge sources connected to your RAG pipelines and evaluation
            workflows.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setError("");
            setShowCreateForm(true);
          }}
        >
          <span>+</span>
          Create dataset
        </button>
      </header>

      {showCreateForm && (
        <section className="create-dataset-panel">
          <div className="create-panel-header">
            <div>
              <span className="eyebrow">NEW RESOURCE</span>
              <h2>Create dataset</h2>
              <p>
                Add a knowledge source that can later contain documents,
                chunks, embeddings, and evaluation cases.
              </p>
            </div>

            <button
              className="close-panel-button"
              onClick={() => {
                setShowCreateForm(false);
                setName("");
                setDescription("");
                setError("");
              }}
              aria-label="Close create dataset form"
            >
              ×
            </button>
          </div>

          <form
            className="create-dataset-form"
            onSubmit={handleCreateDataset}
          >
            <div className="form-field">
              <label htmlFor="dataset-name">
                Dataset name
              </label>

              <input
                id="dataset-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Product Documentation"
                autoFocus
              />
            </div>

            <div className="form-field">
              <label htmlFor="dataset-description">
                Description
              </label>

              <textarea
                id="dataset-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe what this knowledge source contains..."
                rows={4}
              />
            </div>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowCreateForm(false);
                  setName("");
                  setDescription("");
                  setError("");
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={creating}
              >
                {creating ? "Creating..." : "Create dataset"}
              </button>
            </div>
          </form>
        </section>
      )}

      {!showCreateForm && error && (
        <div className="api-error">
          <span>{error}</span>

          <button onClick={loadDatasets}>
            Retry
          </button>
        </div>
      )}

      <section className="resource-toolbar">
        <div className="resource-search">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search datasets..."
            aria-label="Search datasets"
          />
        </div>

        <div className="toolbar-actions">
          <button className="filter-button">
            Status <span>All</span>⌄
          </button>

          <button className="filter-button">
            Sort <span>Recently updated</span>⌄
          </button>
        </div>
      </section>

      <section className="dataset-registry">
        <div className="registry-header">
          <span>DATASET</span>
          <span>DOCUMENTS</span>
          <span>CHUNKS</span>
          <span>EMBEDDINGS</span>
          <span>STATUS</span>
          <span></span>
        </div>

        {loading ? (
          <div className="registry-state">
            <span className="registry-state-mark">◇</span>
            <strong>Loading datasets</strong>
            <p>Connecting to the RAGForge API...</p>
          </div>
        ) : datasets.length === 0 ? (
          <div className="registry-state">
            <span className="registry-state-mark">◇</span>
            <strong>No datasets yet</strong>
            <p>
              Create your first dataset to start building a knowledge source.
            </p>

            <button
              className="secondary-button"
              onClick={() => setShowCreateForm(true)}
            >
              Create your first dataset
            </button>
          </div>
        ) : (
          datasets.map((dataset) => (
            <article
              className="dataset-entry"
              key={dataset.id}
            >
              <div className="dataset-identity">
                <div className="dataset-mark">◇</div>

                <div>
                  <h2>{dataset.name}</h2>

                  <p>
                    {dataset.description ||
                      "No description provided."}
                  </p>
                </div>
              </div>

              <div className="dataset-value">—</div>

              <div className="dataset-value">—</div>

              <div className="dataset-value">—</div>

              <div className="dataset-status">
                <span className="status-dot"></span>
                Active
              </div>

              <Link
                href={`/datasets/${dataset.id}`}
                className="dataset-open"
              >
                Open <span>→</span>
              </Link>
            </article>
          ))
        )}
      </section>

      <footer className="resource-footer">
        <span>
          {datasets.length}{" "}
          {datasets.length === 1 ? "dataset" : "datasets"}
        </span>

        <span>
          Connected to RAGForge knowledge pipeline
        </span>
      </footer>
    </>
  );
}