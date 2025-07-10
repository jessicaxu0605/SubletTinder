from fastapi import APIRouter, HTTPException, status
from models import Photo, ListingCreate
from utils.location_helper import resolve_address_from_google, insert_location_if_not_exists
from models import Photo, ListingCreate, ListingUpdate
from asyncpg import CheckViolationError, PostgresError
from datetime import date
from db import get_pool

router = APIRouter()

async def insert_listing_amenities(connection, listing_id: int, amenities: list[int]):
    if not amenities:
        return

    rows = [(listing_id, amenity_id) for amenity_id in amenities]

    # We can also make bulk insert for this
    # The assumption though is that there won't be thousands of amenities. Leave this for now
    await connection.executemany("""
        INSERT INTO listing_amenities (listing_id, amenity_id)
        VALUES ($1, $2)
    """, rows)

async def insert_listing_photos_bulk(connection, listing_id: int, photos: list[Photo]):
    if not photos:
        return

    values_clause = ", ".join(
        f"(${i * 3 + 1}, ${i * 3 + 2}, ${i * 3 + 3})" for i in range(len(photos))
    )

    insert_query = f"""
        INSERT INTO photos (listing_id, url, label)
        VALUES {values_clause}
    """

    args = []
    for photo in photos:
        args.extend([listing_id, photo.url, photo.label])

    await connection.execute(insert_query, *args)

async def insert_listing(listing: ListingCreate) -> int:
    query = """
        INSERT INTO listings (
            user_id, is_active, locations_id, start_date, end_date,
            target_gender, asking_price, building_type_id,
            num_bedrooms, num_bathrooms, pet_friendly,
            utilities_incl, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
    """

    pool = await get_pool()
    async with pool.acquire() as connection:
        async with connection.transaction():
            row = await connection.fetchrow(query,
                listing.user_id,
                listing.is_active,
                listing.locations_id,
                listing.start_date,
                listing.end_date,
                listing.target_gender.value,
                listing.asking_price,
                listing.building_type_id,
                listing.num_bedrooms,
                listing.num_bathrooms,
                listing.pet_friendly,
                listing.utilities_incl,
                listing.description
            )
            if not row:
                raise RuntimeError("Insert succeeded but no ID returned.")
            listing_id = row["id"]

            # add amenities
            await insert_listing_amenities(connection, listing_id, listing.amenities)

            # add photos
            await insert_listing_photos_bulk(connection, listing_id, listing.photos)

            return listing_id


@router.post("/listings", status_code=status.HTTP_201_CREATED)
async def create_listing(listing: ListingCreate):
    try:
        if not listing.raw_address:
            raise HTTPException(status_code=400, detail="Missing address")

        place_data = await resolve_address_from_google(listing.raw_address)
        print("[DEBUG] place_data:", place_data)

        pool = await get_pool()
        async with pool.acquire() as connection:
            location_id = await insert_location_if_not_exists(connection, place_data)
            print(f"[DEBUG] location_id inserted or found: {location_id}")

            async with connection.transaction():
                listing.locations_id = location_id
                new_id = await insert_listing(listing)

        return {"message": "Listing created", "id": new_id}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating listing: {str(e)}"
        )


@router.get("/listings/{listing_id}")
async def get_listing(listing_id: int):
    query = """
        SELECT 
            l.id,
            l.user_id,
            l.locations_id,
            u.first_name || ' ' || u.last_name AS poster_name,
            u.email AS poster_email,
            l.is_active,
            l.start_date,
            l.end_date,
            l.target_gender,
            l.asking_price,
            l.num_bedrooms,
            l.num_bathrooms,
            l.pet_friendly,
            l.utilities_incl,
            l.description,
            loc.address_string,
            loc.latitude,
            loc.longitude,
            bt.type AS building_type,
            COALESCE(
                (SELECT json_agg(json_build_object('url', p.url, 'label', p.label))
                 FROM photos p
                 WHERE p.listing_id = l.id), '[]'
            ) AS photos,
            COALESCE(
                (SELECT json_agg(a.name)
                 FROM listing_amenities la
                 JOIN amenities a ON la.amenity_id = a.id
                 WHERE la.listing_id = l.id), '[]'
            ) AS amenities
        FROM listings l
        JOIN users u ON l.user_id = u.id
        JOIN locations loc ON l.locations_id = loc.id
        LEFT JOIN building_types bt ON l.building_type_id = bt.id
        WHERE l.id = $1
    """

    pool = await get_pool()
    async with pool.acquire() as connection:
        row = await connection.fetchrow(query, listing_id)
        if not row:
            raise HTTPException(status_code=404, detail="Listing not found")
        return dict(row)

@router.put("/listings/{listing_id}/deactivate/{user_id}")
async def deactivate_listing(listing_id: int, user_id: int):
    query = """
        UPDATE listings
        SET is_active = FALSE
        WHERE id = $1 AND user_id = $2
        RETURNING *
    """

    pool = await get_pool()
    async with pool.acquire() as connection:
        row = await connection.fetchrow(query, listing_id, user_id)
        if not row:
            raise HTTPException(status_code=404, detail="Listing not found or user not authorized")
        return dict(row)

@router.get("/listings/{listing_id}/matches")
async def get_listing_matches(listing_id: int):
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
listing AS (
    SELECT * FROM listings WHERE id = $1
)
SELECT
    rc.*,
    (
        p.base_score *
        POWER(p.distance_factor_base, rc.distance_km) *
        POWER(p.price_factor_base,
            (l.asking_price + CASE WHEN rc.utilities_incl THEN 0 ELSE p.utilities_adjustment END) - rc.budget) *
        POWER(p.bathroom_factor_base, (rc.num_bathrooms - l.num_bathrooms)) *
        CASE WHEN rc.building_type_id = l.building_type_id THEN p.building_type_factor ELSE 1 END *
        CASE WHEN rc.gender IS NULL OR rc.gender = l.target_gender THEN p.gender_factor ELSE 1 END
    ) AS score
FROM get_renter_candidates($1) rc, listing l, score_params p
ORDER BY score DESC;
    """

    pool = await get_pool()
    async with pool.acquire() as connection:
        rows = await connection.fetch(query, listing_id)
        if not rows:
            return {"matches": [], "message": "No matches found for this listing"}
        
        matches = [dict(row) for row in rows]
        return {"matches": matches, "count": len(matches)}

@router.patch("/listings/{listing_id}")
async def partial_update_listing(listing_id: int, listing: ListingUpdate):
    pool = await get_pool()
    async with pool.acquire() as connection:
        async with connection.transaction():
            existing = await connection.fetchrow("SELECT * FROM listings WHERE id = $1", listing_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Listing not found")

            updated_values = {
                "start_date": listing.start_date if listing.start_date is not None else existing["start_date"],
                "end_date": listing.end_date if listing.end_date is not None else existing["end_date"],
                "target_gender": listing.target_gender.value if listing.target_gender is not None else existing["target_gender"],
                "asking_price": listing.asking_price if listing.asking_price is not None else existing["asking_price"],
                "num_bedrooms": listing.num_bedrooms if listing.num_bedrooms is not None else existing["num_bedrooms"],
                "num_bathrooms": listing.num_bathrooms if listing.num_bathrooms is not None else existing["num_bathrooms"],
                "pet_friendly": listing.pet_friendly if listing.pet_friendly is not None else existing["pet_friendly"],
                "utilities_incl": listing.utilities_incl if listing.utilities_incl is not None else existing["utilities_incl"],
                "description": listing.description if listing.description is not None else existing["description"],
            }

            update_query = """
                UPDATE listings SET
                    start_date = $2,
                    end_date = $3,
                    target_gender = $4,
                    asking_price = $5,
                    num_bedrooms = $6,
                    num_bathrooms = $7,
                    pet_friendly = $8,
                    utilities_incl = $9,
                    description = $10
                WHERE id = $11
            """

            try:
                await connection.execute(update_query, *updated_values.values(), listing_id)

                if listing.amenities is not None:
                    await connection.execute("DELETE FROM listing_amenities WHERE listing_id = $1", listing_id)
                    await insert_listing_amenities(connection, listing_id, listing.amenities)

                if listing.photos_to_delete:
                    await connection.execute(
                        "DELETE FROM photos WHERE listing_id = $1 AND url = ANY($2::text[])",
                        listing_id,
                        listing.photos_to_delete
                    )

                if listing.photos_to_add:
                    await insert_listing_photos_bulk(connection, listing_id, listing.photos_to_add)

            except CheckViolationError as e:
                # remaining constraints has no friendly language because we're not updating them
                msg = str(e)
                if "chk_start_date_future" in msg:
                    detail = "Start date must be in the future."
                elif "chk_term_length" in msg:
                    detail = "The rental term must be at least 1 month, at most 1 year"
                else:
                    detail = "Invalid data provided."
                raise HTTPException(status_code=400, detail=detail)

            except PostgresError as e:
                raise HTTPException(status_code=500, detail="A database error occurred.")

    return {"message": "Listing updated successfully"}


@router.patch("/listings/{listing_id}")
async def partial_update_listing(listing_id: int, listing: ListingUpdate):
    pool = await get_pool()
    async with pool.acquire() as connection:
        async with connection.transaction():
            existing = await connection.fetchrow("SELECT * FROM listings WHERE id = $1", listing_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Listing not found")

            updated_values = {
                "is_active": listing.is_active if listing.is_active is not None else existing["is_active"],
                "start_date": listing.start_date if listing.start_date is not None else existing["start_date"],
                "end_date": listing.end_date if listing.end_date is not None else existing["end_date"],
                "target_gender": listing.target_gender.value if listing.target_gender is not None else existing["target_gender"],
                "asking_price": listing.asking_price if listing.asking_price is not None else existing["asking_price"],
                "num_bedrooms": listing.num_bedrooms if listing.num_bedrooms is not None else existing["num_bedrooms"],
                "num_bathrooms": listing.num_bathrooms if listing.num_bathrooms is not None else existing["num_bathrooms"],
                "pet_friendly": listing.pet_friendly if listing.pet_friendly is not None else existing["pet_friendly"],
                "utilities_incl": listing.utilities_incl if listing.utilities_incl is not None else existing["utilities_incl"],
                "description": listing.description if listing.description is not None else existing["description"],
            }

            update_query = """
                UPDATE listings SET
                    is_active = $1,
                    start_date = $2,
                    end_date = $3,
                    target_gender = $4,
                    asking_price = $5,
                    num_bedrooms = $6,
                    num_bathrooms = $7,
                    pet_friendly = $8,
                    utilities_incl = $9,
                    description = $10
                WHERE id = $11
            """

            try:
                await connection.execute(update_query, *updated_values.values(), listing_id)

                if listing.amenities is not None:
                    await connection.execute("DELETE FROM listing_amenities WHERE listing_id = $1", listing_id)
                    await insert_listing_amenities(connection, listing_id, listing.amenities)

                if listing.photos_to_delete:
                    await connection.execute(
                        "DELETE FROM photos WHERE listing_id = $1 AND url = ANY($2::text[])",
                        listing_id,
                        listing.photos_to_delete
                    )

                if listing.photos_to_add:
                    await insert_listing_photos_bulk(connection, listing_id, listing.photos_to_add)

            except CheckViolationError as e:
                # remaining constraints has no friendly language because we're not updating them
                msg = str(e)
                if "chk_start_date_future" in msg:
                    detail = "Start date must be in the future."
                elif "chk_term_length" in msg:
                    detail = "The rental term must be at least the required minimum length."
                else:
                    detail = "Invalid data provided."
                raise HTTPException(status_code=400, detail=detail)

            except PostgresError as e:
                raise HTTPException(status_code=500, detail="A database error occurred.")

    return {"message": "Listing updated successfully"}

