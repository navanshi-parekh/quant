import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Binds your live Groq API key into our centralized application settings
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    MP_API_KEY = os.getenv("FMP_API_KEY")
    HOST = os.getenv("HOST", "127.0.0.1")
    PORT = int(os.getenv("PORT", 8000))

settings = Settings()