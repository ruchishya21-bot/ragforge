import json
import re

import httpx
from fastembed import TextEmbedding


MODEL_NAME = "BAAI/bge-small-en-v1.5"

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
LLM_MODEL_NAME = "llama3.2:3b"

_model = None


def get_embedding_model() -> TextEmbedding:
    global _model

    if _model is None:
        _model = TextEmbedding(
            model_name=MODEL_NAME
        )

    return _model


def cosine_similarity(
    vector_a: list[float],
    vector_b: list[float],
) -> float:
    dot_product = sum(
        a * b
        for a, b in zip(vector_a, vector_b)
    )

    magnitude_a = sum(
        a * a
        for a in vector_a
    ) ** 0.5

    magnitude_b = sum(
        b * b
        for b in vector_b
    ) ** 0.5

    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0

    return dot_product / (
        magnitude_a * magnitude_b
    )


def calculate_answer_similarity(
    expected_answer: str,
    actual_answer: str,
) -> float:
    model = get_embedding_model()

    vectors = list(
        model.embed(
            [
                expected_answer,
                actual_answer,
            ]
        )
    )

    expected_vector = vectors[0].tolist()
    actual_vector = vectors[1].tolist()

    return cosine_similarity(
        expected_vector,
        actual_vector,
    )


def calculate_context_relevance(
    query: str,
    context_chunks: list[str],
) -> float:
    if not context_chunks:
        return 0.0

    model = get_embedding_model()

    vectors = list(
        model.embed(
            [query] + context_chunks
        )
    )

    query_vector = vectors[0].tolist()

    similarities = []

    for vector in vectors[1:]:
        similarities.append(
            cosine_similarity(
                query_vector,
                vector.tolist(),
            )
        )

    return sum(similarities) / len(similarities)


def _extract_json_object(text: str) -> dict:
    match = re.search(
        r"\{.*\}",
        text,
        re.DOTALL,
    )

    if not match:
        raise ValueError(
            "Faithfulness evaluator did not return JSON."
        )

    return json.loads(match.group())


async def calculate_faithfulness(
    question: str,
    context: str,
    actual_answer: str,
) -> float:
    prompt = f"""
You are evaluating the faithfulness of an answer produced by a RAG system.

Faithfulness means that the claims in the answer are supported by the
provided context.

Do not use outside knowledge.

QUESTION:
{question}

CONTEXT:
{context}

GENERATED ANSWER:
{actual_answer}

Evaluate whether the generated answer is fully supported by the context.

Return ONLY valid JSON in exactly this format:

{{
    "score": 0.0
}}

Scoring rules:

1.0 = all important claims are directly supported by the context.
0.75 = most claims are supported, with a minor unsupported detail.
0.50 = some claims are supported but important claims are unsupported.
0.25 = very little of the answer is supported.
0.0 = the answer is not supported by the context.

Do not include explanations.
"""

    payload = {
        "model": LLM_MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "format": "json",
    }

    async with httpx.AsyncClient(
        timeout=120.0
    ) as client:
        response = await client.post(
            OLLAMA_URL,
            json=payload,
        )

        response.raise_for_status()

        data = response.json()

    evaluator_response = data["response"]

    parsed = _extract_json_object(
        evaluator_response
    )

    score = float(
        parsed.get("score", 0.0)
    )

    return max(
        0.0,
        min(1.0, score),
    )