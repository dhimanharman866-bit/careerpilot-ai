import os
from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from langchain_core.output_parsers import JsonOutputParser

load_dotenv()

llm = ChatGroq(model="openai/gpt-oss-120b",api_key=os.getenv("GROQ_API_KEY"),temperature=0.3)

parser=JsonOutputParser()

prompt = PromptTemplate(
    input_variables=[
        "skills",
        "target_role"
    ],
    template="""
    A candidate currently has these skills:

    {skills}

    Their target role is:

    {target_role}

    Return ONLY valid JSON.

    {{
        "missing_skills": [],
        "roadmap": []
    }}

    missing_skills:
    - skills they need to learn

    roadmap:
    - step-by-step recommendations
    """
)

chain = prompt | llm | parser

def analyze_skill_gap(
    skills: list,
    target_role: str
):

    response = chain.invoke(
        {
            "skills": skills,
            "target_role": target_role
        }
    )

    return response