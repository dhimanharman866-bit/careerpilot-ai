import os

from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

load_dotenv()

llm = ChatGroq(
    model="openai/gpt-oss-120b",
    groq_api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.2
)

parser = JsonOutputParser()

prompt = PromptTemplate(
    template="""
You are an expert ATS Resume Reviewer, Technical Recruiter, and Career Coach.

Your task is to analyze the given resume and return ONLY valid JSON.

Evaluate the resume based on:

- Technical Skills
- Projects
- Education
- Experience
- Certifications
- Resume Structure
- ATS Compatibility
- Overall Job Readiness

Assign an overall resume_score between 0 and 100.

Scoring Guidelines:

90-100 : Outstanding resume, interview ready.
80-89  : Strong resume with minor improvements.
70-79  : Good resume but needs improvement.
60-69  : Average resume.
Below 60 : Weak resume.

IMPORTANT RULES:

1. Return ONLY JSON.
2. No markdown.
3. No explanation.
4. Every key must always exist.
5. skills must be an array of strings.
6. projects must be an array of strings.
7. strengths must be an array of strings.
8. weaknesses must be an array of strings.
9. resume_score must be an integer.
10. Never return objects inside arrays.
11. Never return null values.
12. If a section is missing return [].

Return EXACTLY this schema:

{{
    "score": 0,
    "skills": [],
    "projects": [],
    "strengths": [],
    "weaknesses": []
}}

Resume:

{resume_text}
""",
    input_variables=["resume_text"]
)

chain = prompt | llm | parser


def analyze_resume_text(resume_text: str):
    return chain.invoke(
        {
            "resume_text": resume_text
        }
    )