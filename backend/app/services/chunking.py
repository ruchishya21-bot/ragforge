def chunk_text(
    text: str,
    chunk_size: int = 500,
    overlap: int = 50,
) -> list[dict]:
    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than 0")

    if overlap < 0:
        raise ValueError("overlap cannot be negative")

    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")

    if not text:
        return []

    chunks = []

    start = 0
    chunk_index = 0
    text_length = len(text)

    while start < text_length:
        end = min(start + chunk_size, text_length)

        chunks.append(
            {
                "content": text[start:end],
                "chunk_index": chunk_index,
                "start_char": start,
                "end_char": end,
            }
        )

        if end == text_length:
            break

        start = end - overlap
        chunk_index += 1

    return chunks