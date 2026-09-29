from backend.app.services.context import build_context


def build_rag_prompt(
    query: str,
    context: str,
) -> str:
    return f"""You are an AI assistant answering questions using retrieved documents.

Use ONLY the information provided in the context.

If the answer cannot be found in the context, say:
"I don't have enough information in the provided documents."

Do not invent facts.

CONTEXT:
{context}

QUESTION:
{query}

ANSWER:
"""


def prepare_rag_prompt(
    query: str,
    retrieval_results,
) -> str:
    context = build_context(retrieval_results)

    return build_rag_prompt(
        query=query,
        context=context,
    )