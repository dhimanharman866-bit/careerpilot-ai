import os 
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

load_dotenv()

llm=ChatGroq(
    model="llama-3.3-70b-versatile",
    groq_api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.4
)

parser=JsonOutputParser()

prompt = PromptTemplate(
    input_variables=[
        "skills",
        "projects",
        "target_role",
        "difficulty"
    ],
    template="""
    Candidate skills:

    {skills}

    Candidate projects:

    {projects}

    Target role:

    {target_role}

    Generate 10 {difficulty} interview questions.

    Difficulty rules:

    Easy:
    - Fundamentals
    - Definitions
    - Beginner concepts

    Medium:
    - Practical development
    - Project-based questions
    - Problem solving

    Hard:
    - System design
    - Optimization
    - Architecture
    - Advanced concepts

    Return ONLY valid JSON.

    {{
        "questions":[
            {{
                "question":"",
                "difficulty":"{difficulty}"
            }}
        ]
    }}

    Focus on:
    - Skills
    - Projects
    - Target role
    """
)

chain=prompt|llm|parser


def generate_questions(skills:list,projects:list,target_role:str,difficulty:str="medium"):
    response=chain.invoke(
        {
            "skills":skills,
            "projects":projects,
            "target_role":target_role,
            "difficulty":difficulty
        }
    )

    return response