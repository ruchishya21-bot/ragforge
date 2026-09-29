from fastembed import TextEmbedding


MODEL_NAME = "BAAI/bge-small-en-v1.5"

_model = None


def get_embedding_model() -> TextEmbedding:
    global _model

    if _model is None:
        _model = TextEmbedding(model_name=MODEL_NAME)

    return _model


def embed_text(text: str) -> list[float]:
    model = get_embedding_model()

    vector = next(model.embed([text]))

    return vector.tolist()


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []

    model = get_embedding_model()

    vectors = model.embed(texts)

    return [vector.tolist() for vector in vectors]