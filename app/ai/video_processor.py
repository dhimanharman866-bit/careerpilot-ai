from moviepy import VideoFileClip

def extract_audio(
        video_path:str,
        audio_path:str
):
    video=VideoFileClip(
        video_path
    )
    video.audio.write_audiofile(
        audio_path
    )
    video.close()