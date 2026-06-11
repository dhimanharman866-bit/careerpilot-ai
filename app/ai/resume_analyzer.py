import os 

from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    groq_api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.3
)

parser=JsonOutputParser()

prompt=PromptTemplate(
    template="""Analyze the following resume.

    Return ONLY valid JSON.

    Format:
    {{
        "skills": [],
        "projects": [],
        "strengths": [],
        "weaknesses": []
    }}

    Resume:
    {resume_text}""",
    input_variables=["resume_text"]
)

chain=prompt|llm|parser


def analyze_resume_text(resume_text:str):
    response=chain.invoke(
        {
            "resume_text":resume_text
        }
    )
    return response
