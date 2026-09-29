from backend.app.api.schemas import RetrievalResult


def build_context(results: list[RetrievalResult]) -> str:
    if not results:
        return "No relevant context was found."

    sections = []

    for index, result in enumerate(results, start=1):
        sections.append(
            f"SOURCE {index}\n"
            f"Document ID: {result.document_id}\n"
            f"Chunk ID: {result.chunk_id}\n"
            f"Content:\n{result.content}"
        )

    return "\n\n".join(sections)