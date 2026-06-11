import os

from dotenv import load_dotenv

from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from langchain_core.output_parsers import JsonOutputParser

load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    groq_api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.3
)

parser = JsonOutputParser()

prompt = PromptTemplate(
    input_variables=[
        "qa_data",
        "average_score"
    ],
    template="""
    Interview Results:

    {qa_data}

    Average Score:

    {average_score}

    Return ONLY valid JSON.

    {{
        "strengths": [],
        "weaknesses": [],
        "final_feedback": ""
    }}
    """
)

chain = prompt | llm | parser


def generate_interview_summary(
    qa_data,
    average_score
):

    return chain.invoke(
        {
            "qa_data": qa_data,
            "average_score": average_score
        }
    )