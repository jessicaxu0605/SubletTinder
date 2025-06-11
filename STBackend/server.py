from fastapi import FastAPI
from psycopg2 import connect, sql

app = FastAPI()

@app.get("/hello")
def read_root():
    return {"message": "Hello, world!"}