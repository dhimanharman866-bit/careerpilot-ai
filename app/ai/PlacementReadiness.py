import os

from dotenv import load_dotenv

from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_groq import ChatGroq

load_dotenv()

llm = ChatGroq(
    model="openai/gpt-oss-120b",
    groq_api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.3
)

parser = JsonOutputParser()

prompt = PromptTemplate(
    input_variables=[
        "skills",
        "projects",
        "resume_strengths",
        "resume_weaknesses",
        "average_score",
        "readiness_score",
        "status"
    ],
    template="""
You are an expert Career Coach and Placement Mentor.

A candidate has completed resume analysis and multiple mock interviews.

Your task is to analyze the candidate profile and generate personalized placement guidance.

Candidate Information

Resume Skills:
{skills}

Projects:
{projects}

Resume Strengths:
{resume_strengths}

Resume Weaknesses:
{resume_weaknesses}

Average Interview Score:
{average_score}/10

Placement Readiness Score:
{readiness_score}/100

Current Status:
{status}

Based ONLY on the above information, return ONLY valid JSON in the following format:

{{
    "summary": "3-5 sentence professional summary.",

    "strengths": [
        "...",
        "..."
    ],

    "weaknesses": [
        "...",
        "..."
    ],

    "recommendations": [
        "...",
        "...",
        "..."
    ],

    "roadmap": [
        {{
            "week": "Week 1",
            "goal": "..."
        }},
        {{
            "week": "Week 2",
            "goal": "..."
        }},
        {{
            "week": "Week 3",
            "goal": "..."
        }},
        {{
            "week": "Week 4",
            "goal": "..."
        }}
    ]
}}

Guidelines:

- Use only the supplied information.
- Do not invent technologies not related to the profile.
- Recommendations must be practical and actionable.
- The roadmap should help improve placement readiness over the next 4 weeks.
- Keep the summary concise and encouraging.
- Return ONLY valid JSON.
- Do NOT use markdown.
- Do NOT include explanations outside the JSON.
"""
)

chain = prompt | llm | parser


def generate_placement_report(
    skills,
    projects,
    resume_strengths,
    resume_weaknesses,
    average_score,
    readiness_score,
    status
):
    return chain.invoke(
        {
            "skills": skills,
            "projects": projects,
            "resume_strengths": resume_strengths,
            "resume_weaknesses": resume_weaknesses,
            "average_score": average_score,
            "readiness_score": readiness_score,
            "status": status
        }
    )