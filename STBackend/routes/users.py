from fastapi import APIRouter, HTTPException, status
from db import get_pool

router = APIRouter()

@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(user_id: int):
    query = "DELETE FROM users WHERE id = $1 RETURNING *"

    pool = await get_pool()
    try:
        async with pool.acquire() as connection:
            async with connection.transaction():
                row = await connection.fetchrow(query, user_id)
                if not row:
                    raise HTTPException(status_code=404, detail="User not found")
                return {"message": "User deleted successfully", "deleted_user": dict(row)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")

@router.get("/users/{user_id}/listings", status_code=status.HTTP_200_OK)
async def get_user_listing_ids(user_id: int):
    query = """
        SELECT id
        FROM listings
        WHERE user_id = $1
        ORDER BY id
    """

    pool = await get_pool()
    try:
        async with pool.acquire() as connection:
            rows = await connection.fetch(query, user_id)
            if not rows:
                return {"listing_ids": [], "message": f"No listings found for user {user_id}"}
            
            listing_ids = [row["id"] for row in rows]
            return {"listing_ids": listing_ids, "count": len(listing_ids)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")

@router.get("/users/{user_id}/renter_profile", status_code=status.HTTP_200_OK)
async def get_renter_profile_id(user_id: int):
    query = """
        SELECT id
        FROM renter_profiles
        WHERE user_id = $1
    """

    pool = await get_pool()
    async with pool.acquire() as connection:
        row = await connection.fetchrow(query, user_id)
        if not row:
            raise HTTPException(status_code=404, detail=f"No renter profile found for user {user_id}")
        return {"renter_profile_id": row["id"]}

