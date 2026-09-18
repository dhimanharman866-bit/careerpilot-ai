import os

from dotenv import load_dotenv

from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from langchain_core.output_parsers import JsonOutputParser

load_dotenv()

llm =ChatGroq(
    model="openai/gpt-oss-120b",
    groq_api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.3
)

parser=JsonOutputParser()

prompt=PromptTemplate(
    input_variable=['question','answer'],
    template="""
    Interview Question:

    {question}

    Candidate Answer:

    {answer}

    Evaluate the answer.

    Return ONLY valid JSON.

    {{
        "score": 0,
        "feedback": "",
        "strengths": [],
        "improvements": []
    }}

    Rules:
    - score should be between 1 and 10
    - feedback should be concise
    - strengths should contain positive points
    - improvements should contain missing concepts
    """
)

chain=prompt|llm|parser
def evaluate_answer(question:str,answer:str):
    response=chain.invoke({
        "question":question,
        "answer":answer
    })
    return response