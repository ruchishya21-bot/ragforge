from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.schemas import (
    BenchmarkCaseResult,
    BenchmarkResponse,
    EvaluationCaseCreate,
    EvaluationCaseResponse,
    EvaluationResultResponse,
    RetrievalResult,
)
from backend.app.db.models import (
    Chunk,
    Dataset,
    Document,
    EvaluationCase,
    EvaluationResult,
)
from backend.app.db.session import AsyncSessionLocal
from backend.app.services.context import build_context
from backend.app.services.embeddings import embed_text
from backend.app.services.evaluation import (
    calculate_answer_similarity,
    calculate_context_relevance,
    calculate_faithfulness,
)
from backend.app.services.llm import generate_answer
from backend.app.services.rag import build_rag_prompt


router = APIRouter(
    prefix="/evaluation",
    tags=["evaluation"],
)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def evaluate_case(
    evaluation_case: EvaluationCase,
    db: AsyncSession,
) -> EvaluationResult:
    query_vector = embed_text(
        evaluation_case.question
    )

    distance = Chunk.embedding.cosine_distance(
        query_vector
    )

    statement = (
        select(
            Chunk,
            distance.label("distance"),
        )
        .join(
            Document,
            Document.id == Chunk.document_id,
        )
        .where(
            Document.dataset_id
            == evaluation_case.dataset_id,
            Chunk.embedding.is_not(None),
        )
        .order_by(distance)
        .limit(5)
    )

    result = await db.execute(statement)

    rows = result.all()

    retrieval_results = [
        RetrievalResult(
            chunk_id=chunk.id,
            document_id=chunk.document_id,
            content=chunk.content,
            chunk_index=chunk.chunk_index,
            similarity=1 - float(distance_value),
        )
        for chunk, distance_value in rows
    ]

    if not retrieval_results:
        raise HTTPException(
            status_code=404,
            detail="No embedded chunks found for this dataset",
        )

    context = build_context(
        retrieval_results
    )

    prompt = build_rag_prompt(
        query=evaluation_case.question,
        context=context,
    )

    actual_answer = await generate_answer(
        prompt
    )

    answer_similarity = calculate_answer_similarity(
        expected_answer=evaluation_case.expected_answer,
        actual_answer=actual_answer,
    )

    context_relevance = calculate_context_relevance(
        query=evaluation_case.question,
        context_chunks=[
            result.content
            for result in retrieval_results
        ],
    )

    faithfulness = await calculate_faithfulness(
        question=evaluation_case.question,
        context=context,
        actual_answer=actual_answer,
    )

    evaluation_result = EvaluationResult(
        evaluation_case_id=evaluation_case.id,
        actual_answer=actual_answer,
        answer_similarity=answer_similarity,
        context_relevance=context_relevance,
        faithfulness=faithfulness,
    )

    db.add(evaluation_result)

    await db.flush()

    return evaluation_result


@router.post(
    "/cases",
    response_model=EvaluationCaseResponse,
    status_code=201,
)
async def create_evaluation_case(
    case_data: EvaluationCaseCreate,
    db: AsyncSession = Depends(get_db),
):
    dataset = await db.get(
        Dataset,
        case_data.dataset_id,
    )

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found",
        )

    evaluation_case = EvaluationCase(
        dataset_id=case_data.dataset_id,
        question=case_data.question,
        expected_answer=case_data.expected_answer,
    )

    db.add(evaluation_case)

    await db.commit()
    await db.refresh(evaluation_case)

    return evaluation_case


@router.get(
    "/datasets/{dataset_id}/cases",
    response_model=list[EvaluationCaseResponse],
)
async def list_evaluation_cases(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
):
    dataset = await db.get(
        Dataset,
        dataset_id,
    )

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found",
        )

    result = await db.execute(
        select(EvaluationCase)
        .where(
            EvaluationCase.dataset_id == dataset_id
        )
        .order_by(EvaluationCase.id)
    )

    return result.scalars().all()


@router.post(
    "/cases/{case_id}/run",
    response_model=EvaluationResultResponse,
)
async def run_evaluation(
    case_id: int,
    db: AsyncSession = Depends(get_db),
):
    evaluation_case = await db.get(
        EvaluationCase,
        case_id,
    )

    if evaluation_case is None:
        raise HTTPException(
            status_code=404,
            detail="Evaluation case not found",
        )

    evaluation_result = await evaluate_case(
        evaluation_case,
        db,
    )

    await db.commit()
    await db.refresh(evaluation_result)

    return evaluation_result


@router.post(
    "/datasets/{dataset_id}/benchmark",
    response_model=BenchmarkResponse,
)
async def run_benchmark(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
):
    dataset = await db.get(
        Dataset,
        dataset_id,
    )

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found",
        )

    result = await db.execute(
        select(EvaluationCase)
        .where(
            EvaluationCase.dataset_id == dataset_id
        )
        .order_by(EvaluationCase.id)
    )

    evaluation_cases = result.scalars().all()

    if not evaluation_cases:
        raise HTTPException(
            status_code=404,
            detail="No evaluation cases found for this dataset",
        )

    benchmark_results = []

    for evaluation_case in evaluation_cases:
        evaluation_result = await evaluate_case(
            evaluation_case,
            db,
        )

        benchmark_results.append(
            BenchmarkCaseResult(
                evaluation_case_id=evaluation_case.id,
                actual_answer=evaluation_result.actual_answer,
                answer_similarity=evaluation_result.answer_similarity,
                context_relevance=evaluation_result.context_relevance,
                faithfulness=evaluation_result.faithfulness,
            )
        )

    await db.commit()

    total_cases = len(evaluation_cases)
    completed_cases = len(benchmark_results)

    average_answer_similarity = (
        sum(
            result.answer_similarity
            for result in benchmark_results
        )
        / completed_cases
    )

    average_context_relevance = (
        sum(
            result.context_relevance
            for result in benchmark_results
        )
        / completed_cases
    )

    average_faithfulness = (
        sum(
            result.faithfulness
            for result in benchmark_results
        )
        / completed_cases
    )

    return BenchmarkResponse(
        dataset_id=dataset_id,
        total_cases=total_cases,
        completed_cases=completed_cases,
        average_answer_similarity=average_answer_similarity,
        average_context_relevance=average_context_relevance,
        average_faithfulness=average_faithfulness,
        results=benchmark_results,
    )