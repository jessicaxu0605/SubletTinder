from fastapi import APIRouter, HTTPException, status
from models import RenterProfileCreate
from utils.location_helper import resolve_address_from_google, insert_location_if_not_exists
from db import get_pool

router = APIRouter()

@router.post("/renters", status_code=status.HTTP_201_CREATED)
async def create_renter_profile(profile: RenterProfileCreate):
    if not profile.raw_address:
        raise HTTPException(status_code=400, detail="Missing address")

    try:
        place_data = await resolve_address_from_google(profile.raw_address)

        pool = await get_pool()
        async with pool.acquire() as connection:
            location_id = await insert_location_if_not_exists(connection, place_data)

            query = """
                INSERT INTO renter_profiles (
                    user_id, locations_id, start_date, end_date,
                    age, gender, budget, building_type_id,
                    num_bedrooms, num_bathrooms, has_pet, bio
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
            """

            row = await connection.fetchrow(query,
                profile.user_id,
                location_id,
                profile.start_date,
                profile.end_date,
                profile.age,
                profile.gender.value,
                profile.budget,
                profile.building_type_id,
                profile.num_bedrooms,
                profile.num_bathrooms,
                profile.has_pet,
                profile.bio
            )

            if not row:
                raise HTTPException(status_code=500, detail="Renter profile insert failed")

            return {"message": "Renter profile created", "id": row["id"]}

    except Exception as e:
        if 'renter_profiles_user_id_key' in str(e):
            raise HTTPException(status_code=400, detail="User already has a renter profile.")
        elif 'chk_' in str(e):
            raise HTTPException(status_code=400, detail=f"Constraint violation: {str(e)}")
        else:
            raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")

@router.get("/renters/{renter_id}")
async def get_renter_profile(renter_id: int):
    query = """
        SELECT 
            rp.id,
            rp.user_id,
            u.first_name || ' ' || u.last_name AS full_name,
            u.email AS email,
            rp.is_active,
            rp.start_date,
            rp.end_date,
            rp.age,
            rp.gender,
            rp.budget,
            rp.num_bedrooms,
            rp.num_bathrooms,
            rp.has_pet,
            rp.bio,
            loc.address_string,
            loc.latitude,
            loc.longitude,
            bt.type AS building_type
        FROM renter_profiles rp
        JOIN users u ON rp.user_id = u.id
        JOIN locations loc ON rp.locations_id = loc.id
        LEFT JOIN building_types bt ON rp.building_type_id = bt.id
        WHERE rp.id = $1
    """

    pool = await get_pool()
    async with pool.acquire() as connection:
        row = await connection.fetchrow(query, renter_id)
        if not row:
            raise HTTPException(status_code=404, detail="Renter profile not found")
        return dict(row)

@router.put("/renters/{renter_id}/deactivate/{user_id}")
async def deactivate_renter_profile(renter_id: int, user_id: int):
    query = """
        UPDATE renter_profiles
        SET is_active = FALSE
        WHERE id = $1 AND user_id = $2
        RETURNING *
    """

    pool = await get_pool()
    async with pool.acquire() as connection:
        row = await connection.fetchrow(query, renter_id, user_id)
        if not row:
            raise HTTPException(status_code=404, detail="Renter profile not found or user not authorized")
        return dict(row)

@router.get("/renters/{renter_id}/matches")
async def get_renter_matches(renter_id: int):
    query = """
        WITH score_params AS (
            SELECT
                100.0 AS base_score,
                1.01 AS distance_factor_base,
                0.995 AS price_factor_base,
                1.2 AS bathroom_factor_base,
                100 AS utilities_adjustment,
                1.2 AS building_type_factor,
                1.5 AS gender_factor
        ),
        renter AS (
            SELECT * FROM renter_profiles WHERE id = $1
        )
        SELECT
            r.budget,
            lc.*,
            (
                p.base_score *
                POWER(p.distance_factor_base, lc.distance_km) *
                POWER(p.price_factor_base,
                    (lc.asking_price + CASE WHEN lc.utilities_incl THEN 0 ELSE p.utilities_adjustment END) - r.budget) *
                POWER(p.bathroom_factor_base, (lc.num_bathrooms - r.num_bathrooms)) *
                CASE WHEN lc.building_type_id = r.building_type_id THEN p.building_type_factor ELSE 1 END *
                CASE WHEN lc.target_gender IS NULL OR lc.target_gender = r.gender THEN p.gender_factor ELSE 1 END
            ) AS score
        FROM get_listing_candidates($1) lc, renter r, score_params p
        ORDER BY score DESC;
    """

    pool = await get_pool()
    async with pool.acquire() as connection:
        rows = await connection.fetch(query, renter_id)
        if not rows:
            return {"matches": [], "message": "No matches found for this renter"}
        
        matches = [dict(row) for row in rows]
        return {"matches": matches, "count": len(matches)}

