import subprocess
import imageio_ffmpeg


def extract_audio(video_path: str, audio_path: str):
    """
    Extract audio from a video file using the ffmpeg binary
    bundled with imageio-ffmpeg (no system ffmpeg required).
    Output: 16 kHz mono WAV — optimal for Whisper transcription.
    """
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    result = subprocess.run(
        [
            ffmpeg_exe,
            "-y",                  # overwrite output without asking
            "-i", video_path,      # input video
            "-vn",                 # drop video stream
            "-acodec", "pcm_s16le",# raw PCM 16-bit — widest WAV compatibility
            "-ar", "16000",        # 16 kHz sample rate (Whisper's native rate)
            "-ac", "1",            # mono
            audio_path,            # output audio file
        ],
        capture_output=True,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"ffmpeg audio extraction failed:\n{result.stderr.decode(errors='replace')}"
        )