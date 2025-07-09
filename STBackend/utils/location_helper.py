import httpx

import os
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

async def resolve_address_from_google(address: str):
    url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={GOOGLE_API_KEY}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        data = resp.json()
        if data["status"] != "OK":
            raise ValueError("Google API failed: " + data["status"])

        result = data["results"][0]
        return {
            "places_api_id": result["place_id"],
            "address_string": result["formatted_address"],
            "latitude": result["geometry"]["location"]["lat"],
            "longitude": result["geometry"]["location"]["lng"]
        }

async def insert_location_if_not_exists(connection, place_data: dict) -> int:
    query_check = "SELECT id FROM locations WHERE places_api_id = CAST($1 AS TEXT)"
    existing = await connection.fetchrow(query_check, place_data["places_api_id"])
    if existing:
        print(f"[INFO] Existing location found: id={existing['id']}")
        return existing["id"]

    query_insert = """
        INSERT INTO locations (places_api_id, address_string, latitude, longitude)
        VALUES ($1, $2, $3, $4)
        RETURNING id
    """
    try:
        print(f"[INFO] Inserting location: {place_data}")
        row = await connection.fetchrow(
            query_insert,
            place_data["places_api_id"],
            place_data["address_string"],
            place_data["latitude"],
            place_data["longitude"]
        )
        if row is None:
            raise RuntimeError("Location insert failed: fetchrow returned None")
        print(f"[INFO] Inserted new location with id={row['id']}")
        return row["id"]
    except Exception as e:
        print(f"[ERROR] insert_location_if_not_exists failed: {e}")
        raise RuntimeError(f"Failed to insert location: {str(e)}")
    