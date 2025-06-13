from fastapi import FastAPI
from psycopg2 import connect
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import os

load_dotenv() 

app = FastAPI()

DATABASE_URL = os.getenv("DATABASE_URL")

@app.get("/hello")
def read_root():
    try:
        conn = connect(DATABASE_URL, cursor_factory=RealDictCursor)
        cur = conn.cursor()
        cur.execute("SELECT NOW()")
        result = cur.fetchone()
        cur.close()
        conn.close()
        return {"message": "Hello, world!", "timestamp": result}
    except Exception as e:
        return {"error": str(e)}
