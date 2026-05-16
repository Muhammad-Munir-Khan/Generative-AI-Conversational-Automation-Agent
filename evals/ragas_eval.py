"""RAG quality evaluation using Ragas.

Edit `EVAL_DATA` with your own (question, ground_truth) pairs covering
your indexed documents, then run:

    python evals/ragas_eval.py

Requires the API to be running and at least one document indexed.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from datasets import Dataset
from ragas import evaluate
from ragas.metrics import (
    answer_relevancy,
    context_precision,
    context_recall,
    faithfulness,
)

from app.core.llm import get_llm
from app.rag.chain import format_context
from app.rag.embeddings import get_embeddings
from app.rag.retrieval import retrieve

# Replace these with questions whose answers actually exist in your docs.
EVAL_DATA = [
    {
        "question": "What is the main topic of the documents?",
        "ground_truth": "Replace this with the actual expected answer.",
    },
]


def build_dataset() -> Dataset:
    rows = {"question": [], "answer": [], "contexts": [], "ground_truth": []}
    for item in EVAL_DATA:
        q = item["question"]
        pairs = retrieve(q)
        docs = [d for d, _ in pairs]
        contexts = [d.page_content for d in docs]
        # Re-run the chain to get the actual answer
        from langchain_core.prompts import ChatPromptTemplate
        from app.rag.chain import SYSTEM_PROMPT

        prompt = ChatPromptTemplate.from_messages(
            [("system", SYSTEM_PROMPT), ("user", "{question}")]
        )
        chain = prompt | get_llm()
        answer = chain.invoke(
            {"context": format_context(docs), "question": q}
        ).content

        rows["question"].append(q)
        rows["answer"].append(answer)
        rows["contexts"].append(contexts)
        rows["ground_truth"].append(item["ground_truth"])
    return Dataset.from_dict(rows)


def main():
    print(f"Evaluating {len(EVAL_DATA)} questions...")
    ds = build_dataset()
    result = evaluate(
        ds,
        metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
        llm=get_llm(),
        embeddings=get_embeddings(),
    )
    print(result)


if __name__ == "__main__":
    main()
