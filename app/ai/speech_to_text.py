import os 
from groq import Groq
from dotenv import load_dotenv
load_dotenv()
client=Groq(api_key=os.getenv("GROQ_API_KEY"))

def transcribe_audio(file_path:str):
    with open(file_path,"rb") as audio_file:
        transcription=(client.audio.transcriptions.create(
            file=audio_file,
            model="whisper-large-v3"
        ))
    return transcription