export default function DatasetsPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">KNOWLEDGE BASE</span>
          <h1>Datasets</h1>
          <p>
            Manage the datasets that power document ingestion, retrieval, and
            RAG evaluation.
          </p>
        </div>

        <button className="primary-button">
          <span>+</span>
          New dataset
        </button>
      </div>

      <section className="datasets-overview">
        <div className="overview-stat">
          <span className="stat-label">TOTAL DATASETS</span>
          <strong>02</strong>
          <span className="stat-description">Active knowledge sources</span>
        </div>

        <div className="overview-stat">
          <span className="stat-label">DOCUMENTS</span>
          <strong>01</strong>
          <span className="stat-description">Indexed documents</span>
        </div>

        <div className="overview-stat">
          <span className="stat-label">CHUNKS</span>
          <strong>03</strong>
          <span className="stat-description">Retrievable segments</span>
        </div>

        <div className="overview-stat">
          <span className="stat-label">EMBEDDINGS</span>
          <strong>03</strong>
          <span className="stat-description">Vector representations</span>
        </div>
      </section>

      <section className="datasets-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">DATA REGISTRY</span>
            <h2>Knowledge sources</h2>
          </div>

          <span className="section-count">2 DATASETS</span>
        </div>

        <div className="dataset-list">
          <article className="dataset-row">
            <div className="dataset-main">
              <div className="dataset-icon">◇</div>

              <div>
                <h3>RAG Document Test Dataset</h3>
                <p>
                  Document retrieval and RAG pipeline validation dataset.
                </p>
              </div>
            </div>

            <div className="dataset-meta">
              <div>
                <span>DOCUMENTS</span>
                <strong>0</strong>
              </div>

              <div>
                <span>CHUNKS</span>
                <strong>0</strong>
              </div>

              <div>
                <span>STATUS</span>
                <strong className="status-active">ACTIVE</strong>
              </div>
            </div>

            <button className="row-action">View →</button>
          </article>

          <article className="dataset-row">
            <div className="dataset-main">
              <div className="dataset-icon">◇</div>

              <div>
                <h3>Embedding Test Dataset</h3>
                <p>
                  Vector embedding and semantic retrieval evaluation dataset.
                </p>
              </div>
            </div>

            <div className="dataset-meta">
              <div>
                <span>DOCUMENTS</span>
                <strong>1</strong>
              </div>

              <div>
                <span>CHUNKS</span>
                <strong>3</strong>
              </div>

              <div>
                <span>STATUS</span>
                <strong className="status-active">ACTIVE</strong>
              </div>
            </div>

            <button className="row-action">View →</button>
          </article>
        </div>
      </section>

      <section className="pipeline-strip">
        <div>
          <span className="eyebrow">RAG PIPELINE</span>
          <h2>Dataset → Documents → Chunks → Embeddings → Retrieval</h2>
        </div>

        <p>
          Every dataset becomes a searchable knowledge source through the
          RAGForge ingestion pipeline.
        </p>
      </section>
    </>
  );
}