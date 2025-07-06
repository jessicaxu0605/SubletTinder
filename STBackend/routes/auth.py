import bcrypt
from fastapi import APIRouter, HTTPException, status
from models import UserCreate, UserLogin, UserResponse
from db import get_pool

router = APIRouter()

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate):

    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    query = """
        INSERT INTO users (email, first_name, last_name, password, profile_photo)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    """

    pool = await get_pool()
    async with pool.acquire() as connection:
        try:
            row = await connection.fetchrow(query, user.email, user.first_name, user.last_name, hashed_password, user.profile_photo)
            return {"message": "User created", "id": row["id"]}
        except Exception as e:
            if "duplicate key" in str(e).lower():
                raise HTTPException(status_code=400, detail="Email already registered")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/login", response_model = UserResponse, status_code=status.HTTP_200_OK)
async def login(user: UserLogin):
    query = "SELECT id, email, password, first_name, last_name, profile_photo FROM users WHERE email = $1"

    pool = await get_pool()

    async with pool.acquire() as connection:
        row = await connection.fetchrow(query, user.email)

        # email doesn't exist
        if not row:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # password doesn't match
        if not bcrypt.checkpw(user.password.encode("utf-8"), row["password"].encode("utf-8")):
            raise HTTPException(status_code=401, detail="Invalid email or password")
    
        return {
            "id": row["id"],
            "email": row["email"],
            "first_name": row["first_name"],
            "last_name": row["last_name"],
            "profile_photo": row["profile_photo"]
        }
