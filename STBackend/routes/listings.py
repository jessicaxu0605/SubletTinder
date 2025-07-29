from fastapi import APIRouter, HTTPException, status
from models import Photo, ListingCreate, ListingUpdate
from asyncpg import CheckViolationError, PostgresError
from utils.location_helper import (
    resolve_address_from_google,
    insert_location_if_not_exists,
)
from db import get_pool

router = APIRouter()


async def insert_listing_amenities(connection, listing_id: int, amenities: list[int]):
    if not amenities:
        return

    rows = [(listing_id, amenity_id) for amenity_id in amenities]

    # We can also make bulk insert for this
    # The assumption though is that there won't be thousands of amenities. Leave this for now
    await connection.executemany(
        """
        INSERT INTO listing_amenities (listing_id, amenity_id)
        VALUES ($1, $2)
    """,
        rows,
    )


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
            row = await connection.fetchrow(
                query,
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
                listing.description,
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
            detail=f"Error creating listing: {str(e)}",
        )


@router.get("/listings/{listing_id}")
async def get_listing(listing_id: int):
    query = """
        SELECT 
            l.id,
            l.user_id,
            u.first_name,
            u.last_name,
            u.email,
            u.profile_photo,
            l.locations_id,
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
            bt.id AS building_type_id,
            bt.type AS building_type,
            COALESCE(
                (SELECT json_agg(json_build_object('url', p.url, 'label', p.label))
                FROM photos p
                WHERE p.listing_id = l.id), '[]'
            ) AS photos,
            COALESCE(
                (SELECT json_agg(json_build_object('id', a.id, 'name', a.name))
                FROM listing_amenities la
                JOIN amenities a ON la.amenity_id = a.id
                WHERE la.listing_id = l.id
                ), '[]'
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
            raise HTTPException(
                status_code=404, detail="Listing not found or user not authorized"
            )
        return dict(row)


@router.put("/listings/{listing_id}/reactivate/{user_id}")
async def reactivate_listing(listing_id: int, user_id: int):
    query = """
        UPDATE listings
        SET is_active = TRUE
        WHERE id = $1 AND user_id = $2
        RETURNING *
    """

    pool = await get_pool()
    async with pool.acquire() as connection:
        row = await connection.fetchrow(query, listing_id, user_id)
        if not row:
            raise HTTPException(
                status_code=404, detail="Listing not found or user not authorized"
            )
        return dict(row)


@router.patch("/listings/{listing_id}")
async def partial_update_listing(listing_id: int, listing: ListingUpdate):
    pool = await get_pool()
    async with pool.acquire() as connection:
        async with connection.transaction():
            existing = await connection.fetchrow(
                "SELECT * FROM listings WHERE id = $1", listing_id
            )
            if not existing:
                raise HTTPException(status_code=404, detail="Listing not found")

            updated_values = {
                "start_date": (
                    listing.start_date
                    if listing.start_date is not None
                    else existing["start_date"]
                ),
                "end_date": (
                    listing.end_date
                    if listing.end_date is not None
                    else existing["end_date"]
                ),
                "target_gender": (
                    listing.target_gender.value
                    if listing.target_gender is not None
                    else existing["target_gender"]
                ),
                "asking_price": (
                    listing.asking_price
                    if listing.asking_price is not None
                    else existing["asking_price"]
                ),
                "num_bedrooms": (
                    listing.num_bedrooms
                    if listing.num_bedrooms is not None
                    else existing["num_bedrooms"]
                ),
                "num_bathrooms": (
                    listing.num_bathrooms
                    if listing.num_bathrooms is not None
                    else existing["num_bathrooms"]
                ),
                "pet_friendly": (
                    listing.pet_friendly
                    if listing.pet_friendly is not None
                    else existing["pet_friendly"]
                ),
                "utilities_incl": (
                    listing.utilities_incl
                    if listing.utilities_incl is not None
                    else existing["utilities_incl"]
                ),
                "description": (
                    listing.description
                    if listing.description is not None
                    else existing["description"]
                ),
            }

            update_query = """
                UPDATE listings SET
                    start_date = $1,
                    end_date = $2,
                    target_gender = $3,
                    asking_price = $4,
                    num_bedrooms = $5,
                    num_bathrooms = $6,
                    pet_friendly = $7,
                    utilities_incl = $8,
                    description = $9
                WHERE id = $10
            """

            try:
                await connection.execute(
                    update_query, *updated_values.values(), listing_id
                )

                if listing.amenities is not None:
                    await connection.execute(
                        "DELETE FROM listing_amenities WHERE listing_id = $1",
                        listing_id,
                    )
                    await insert_listing_amenities(
                        connection, listing_id, listing.amenities
                    )

                if listing.photos_to_delete:
                    await connection.execute(
                        "DELETE FROM photos WHERE listing_id = $1 AND url = ANY($2::text[])",
                        listing_id,
                        listing.photos_to_delete,
                    )

                if listing.photos_to_update:
                    for photo in listing.photos_to_update:
                        await connection.execute(
                            "UPDATE photos SET label = $1 WHERE listing_id = $2 AND url = $3",
                            photo.label,
                            listing_id,
                            photo.url,
                        )

                if listing.photos_to_add:
                    for photo in listing.photos_to_add:
                        if photo.url:
                            # Try to update label for existing photo
                            result = await connection.execute(
                                """UPDATE photos SET label = $1 WHERE listing_id = $2 AND url = $3""",
                                photo.label,
                                listing_id,
                                photo.url,
                            )
                            # If no row was updated, insert as new
                            if result == "UPDATE 0":
                                await connection.execute(
                                    """INSERT INTO photos (listing_id, url, label) VALUES ($1, $2, $3)""",
                                    listing_id,
                                    photo.url,
                                    photo.label,
                                )

            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Error updating listing: {str(e)}",
                )

    return {"message": "Listing updated successfully"}


@router.get("/listings/{listing_id}/renter_matches")
async def get_renter_matches(listing_id: int):
    query = """
WITH score_params AS (
    SELECT
        100.0 AS base_score,
        0.99 AS distance_factor_base,
        0.997 AS price_factor_base,
        1.2 AS bathroom_factor_base,
        100 AS utilities_adjustment,
        1.7 AS gender_factor
),
listing AS (
    SELECT * FROM listings WHERE id = $1
)
SELECT
  rc.id AS renter_id,
  rc.budget,
  rc.num_bedrooms,
  rc.num_bathrooms,
  rc.start_date,
  rc.end_date,
  rc.has_pet,
  rc.bio,
  rc.address_string,
  bt.type AS building_type,
  u.first_name AS renter_first_name,
  u.last_name AS renter_last_name,
  u.profile_photo AS renter_profile_photo,
  rc.distance_km,
  (
    p.base_score *
    POWER(p.distance_factor_base, rc.distance_km) *
    POWER(p.price_factor_base,
      (l.asking_price + CASE WHEN l.utilities_incl THEN 0 ELSE p.utilities_adjustment END) - rc.budget) *
    POWER(p.bathroom_factor_base, (rc.num_bathrooms - l.num_bathrooms)) *
    CASE WHEN rc.gender IS NULL OR rc.gender = l.target_gender THEN p.gender_factor ELSE 1 END
  ) AS score
FROM get_renter_candidates($1) rc
JOIN listing l ON TRUE
JOIN score_params p ON TRUE
LEFT JOIN building_types bt ON rc.building_type_id = bt.id
LEFT JOIN users u ON rc.user_id = u.id
ORDER BY score DESC;
    """

    pool = await get_pool()
    async with pool.acquire() as connection:
        rows = await connection.fetch(query, listing_id)
        if not rows:
            return {
                "matches": [],
                "message": "No renter matches found for this listing",
            }
        matches = [dict(row) for row in rows]
        return {"matches": matches, "count": len(matches)}


@router.get("/listings/recommendations/{current_renter_id}")
async def get_collaborative_recommendations(current_renter_id: int):
    """
    Get collaborative filtering recommendations for a renter based on similar renters' preferences.
    This route finds listings that similar renters (those who liked the same listings) have also liked.
    """
    query = """
    WITH
      -- Listings the current renter has liked (swiped right on)
      current_likes AS (
        SELECT listing_id
        FROM renter_on_listing
        WHERE renter_profile_id = $1
          AND is_right = TRUE
      ),

      --  Other renters who share at least 1 liked listing with the current renter
      similar_renters AS (
        SELECT
          rol2.renter_profile_id,
          COUNT(*) AS common_likes
        FROM renter_on_listing AS rol1
        JOIN renter_on_listing AS rol2
          ON rol1.listing_id = rol2.listing_id
          AND rol2.is_right = TRUE
        WHERE rol1.renter_profile_id = $1
          AND rol1.is_right = TRUE
          AND rol2.renter_profile_id != $1
        GROUP BY rol2.renter_profile_id
        HAVING COUNT(*) >= 1
      ),

      -- Score unseen listings by how many similar renters liked them
      scored_recs AS (
        SELECT
          rol.listing_id,
          COUNT(*) AS score
        FROM similar_renters AS sr
        JOIN renter_on_listing AS rol
          ON rol.renter_profile_id = sr.renter_profile_id
          AND rol.is_right = TRUE
        WHERE rol.listing_id NOT IN (SELECT listing_id FROM current_likes)
        GROUP BY rol.listing_id
      )

    -- Return top recommendations with listing details
    SELECT
      l.*,
      sr.score
    FROM scored_recs AS sr
    JOIN listings AS l
      ON l.id = sr.listing_id
    WHERE l.is_active = TRUE
    ORDER BY sr.score DESC, l.start_date ASC
    LIMIT 10;
    """

    pool = await get_pool()
    async with pool.acquire() as connection:
        try:
            rows = await connection.fetch(query, current_renter_id)
            if not rows:
                return {
                    "recommendations": [],
                    "message": "No recommendations found. Try swiping on more listings to get personalized recommendations.",
                }

            # Get full listing details for each recommended listing
            recommendations = []
            for row in rows:
                listing_id = row["id"]
                score = row["score"]

                # Get full listing details using the existing get_listing endpoint
                listing_details = await get_listing(listing_id)
                if listing_details:
                    # Rename first_name to lister_name
                    if "first_name" in listing_details:
                        listing_details["lister_name"] = listing_details.pop(
                            "first_name"
                        )

                    listing_details["score"] = score
                    recommendations.append(listing_details)

            return {
                "recommendations": recommendations,
                "count": len(recommendations),
                "message": f"Found {len(recommendations)} personalized recommendations",
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error getting recommendations: {str(e)}",
            )
