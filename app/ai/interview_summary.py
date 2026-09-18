import os

from dotenv import load_dotenv

from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from langchain_core.output_parsers import JsonOutputParser

load_dotenv()

llm = ChatGroq(
    model="openai/gpt-oss-120b",
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
    You are a Senior Technical Interviewer preparing the final interview report for a candidate.

IMPORTANT RULES:

- Do NOT evaluate the answers again.
- Do NOT change any scores.
- Do NOT invent new question-level feedback.
- Use ONLY the provided scores and feedback.
- Your job is to summarize the interview professionally.

Interview Results:

Average Score:
{average_score}/10

Question-wise Evaluation:
{qa_data}

Based ONLY on the above evaluation, generate a final interview report.

Return ONLY valid JSON in the following format:

{{
    "summary": "A concise overall summary of the candidate's interview performance.",

    "technical_strengths": [
        "...",
        "..."
    ],

    "communication_strengths": [
        "...",
        "..."
    ],

    "areas_to_improve": [
        "...",
        "..."
    ],

    "placement_readiness": "Ready | Almost Ready | Needs Improvement",

    "recommended_topics": [
        "...",
        "...",
        "..."
    ]
}}

Guidelines:

- "summary" should be 3–5 sentences.
- "technical_strengths" should mention technologies or problem-solving strengths demonstrated during the interview.
- "communication_strengths" should focus on clarity, confidence, and explanation quality.
- "areas_to_improve" should be actionable and based only on the provided evaluations.
- "placement_readiness" must be one of:
    - Ready
    - Almost Ready
    - Needs Improvement
- "recommended_topics" should contain practical topics the candidate should study next.
- Return ONLY valid JSON.
- Do not include markdown.
- Do not include explanations outside the JSON.
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