# RAGForge

## Enterprise RAG Evaluation & Benchmarking Platform

RAGForge is an evaluation and observability platform for diagnosing and benchmarking Retrieval-Augmented Generation (RAG) systems.

It provides a complete workflow for ingesting documents, creating semantic embeddings, performing vector retrieval, generating answers, evaluating RAG quality, and running automated benchmarks.

---

## Overview

A RAG system can fail at different stages of its pipeline. A poor answer may be caused by incorrect documents, ineffective chunking, weak retrieval, irrelevant context, or an unsupported generated response.

RAGForge makes these stages observable through a complete evaluation workflow:

**Documents → Chunks → Embeddings → Retrieval → Generation → Evaluation → Benchmarking**

The central question RAGForge helps answer is:

> **Why is my RAG system failing, and where in the pipeline is the problem?**

---

## Key Features

- Dataset and document management
- Configurable overlapping document chunking
- 384-dimensional semantic embeddings
- PostgreSQL + pgvector vector storage
- Semantic vector retrieval
- RAG-based question answering
- Local Ollama and production Groq LLM support
- Answer similarity evaluation
- Context relevance evaluation
- LLM-based faithfulness evaluation
- Evaluation case management
- Automated benchmarking
- Retrieval observability
- RAG Playground
- Dashboard and system configuration
- Docker and Docker Compose
- Jenkins CI
- Production FastAPI deployment

---

## Evaluation Metrics

### Answer Similarity

Measures the semantic similarity between the expected answer and the generated answer using embeddings and cosine similarity.

### Context Relevance

Measures how relevant the retrieved context is to the user's question.

### Faithfulness

Measures whether the generated answer is supported by the retrieved context without relying on outside knowledge.

---

## Production Benchmark

The production environment successfully completed a benchmark using a Python documentation dataset.

| Metric | Result |
|---|---:|
| Total Cases | 1 |
| Completed Cases | 1 |
| Answer Similarity | 99.6% |
| Context Relevance | 81.4% |
| Faithfulness | 100.0% |

---

## Architecture

**Documents → Chunking → Embeddings → PostgreSQL + pgvector → Retrieval → Context → LLM Generation → Evaluation → Benchmarking**

---

## Technology Stack

### Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy Async
- PostgreSQL
- pgvector
- Alembic
- HTTPX

### Embeddings

- FastEmbed
- `BAAI/bge-small-en-v1.5`
- 384 dimensions

### LLM

- Ollama — local development
- `llama3.2:3b` — local model
- Groq — production
- `openai/gpt-oss-20b` — production model

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Infrastructure

- Docker
- Docker Compose
- Jenkins
- GitHub
- Render

---

## RAG Pipeline

### 1. Documents

Source documents are added to datasets and stored in PostgreSQL.

### 2. Chunking

Documents are divided into overlapping chunks with configurable chunk size and overlap.

### 3. Embeddings

Each chunk is converted into a 384-dimensional vector using `BAAI/bge-small-en-v1.5`.

### 4. Retrieval

The query is embedded and compared against stored chunk embeddings using cosine distance. The highest-ranked chunks are returned as context.

### 5. Generation

The retrieved context and user question are passed to the configured LLM to generate an answer.

### 6. Evaluation

Generated answers are evaluated using answer similarity, context relevance, and faithfulness.

### 7. Benchmarking

All evaluation cases belonging to a dataset can be executed together to produce aggregate RAG quality metrics.

---

## Frontend

The Next.js application provides:

- Dashboard
- Dataset management
- Document management
- Retrieval inspection
- RAG Playground
- Evaluation Cases
- Benchmarks
- System Settings

---

## API

The FastAPI backend provides APIs for:

- Dataset management
- Document management
- Chunking
- Embedding generation
- Semantic retrieval
- RAG generation
- Evaluation
- Benchmarking

Interactive API documentation is available through FastAPI Swagger at `/docs`.

---

## Docker

RAGForge includes Docker support for reproducible environments.

```bash
docker build -t ragforge-api .
docker compose up -d