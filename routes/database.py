import os

import psycopg
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")


def connect_db():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not configured in .env.")
    return psycopg.connect(DATABASE_URL)
