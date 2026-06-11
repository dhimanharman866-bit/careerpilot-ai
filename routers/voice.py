from fastapi import (
    APIRouter,
    UploadFile,
    File
)

import shutil
import os

from app.ai.speech_to_text import (
    transcribe_audio
)

router=APIRouter(
    prefix="/voice",
    tags=["voice interview"]
)

@router.post("/transcribe")
def transcribe(audio_file:UploadFile=File(...)):
    temp_file=f"temp_{audio_file.filename}"
    with open(temp_file,"wb") as buffer: 
    # we created temp buffer because upload_file give us .filename , .name and not path actually so we have to get it thrught creating a temp file
            shutil.copyfileobj(
            audio_file.file,
            buffer
        )
    transcript=transcribe_audio(
        temp_file
    )
    os.remove(temp_file)

    return {
        "transcript":transcript
    }