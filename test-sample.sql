-- Feature 1: Add Listing
INSERT INTO listings (
            user_id, is_active, locations_id, start_date, end_date,
            target_gender, asking_price, building_type_id,
            num_bedrooms, num_bathrooms, pet_friendly,
            utilities_incl, description
        ) VALUES (51, true, 1, '2025-09-01', '2025-12-31', 'female', 1001, 3, 2, 2, true, true, 'Sample description for a new listing')
        RETURNING id;

INSERT INTO listing_amenities (listing_id, amenity_id)
VALUES (103, 22), (103, 13), (103, 4);

INSERT INTO photos (listing_id, url, label)
VALUES (103, 'https://example.com/photo/103_1.jpg', 'living_room'), (103, 'https://example.com/photo/103_2.jpg', 'bathroom');

-- Feature 2: Update Listing
UPDATE listings
SET asking_price = 123321, pet_friendly = TRUE
WHERE id = 2 AND user_id = 93 RETURNING *;

-- Feature 3; Get all the details related to a listing
SELECT 
    l.id,
    l.user_id,
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
WHERE l.id = 1


-- Feature 4: Get the 50 closest active listings ordered by proximity to renter
WITH renter_location AS (
  SELECT loc.latitude AS ref_lat, loc.longitude AS ref_lon
  FROM renter_profiles r
  JOIN locations loc ON r.location_id = loc.id
  WHERE r.id = 1
)

SELECT l.id, l.description, loc.address_string,
  6371 * 2 * ASIN(SQRT(
    POWER(SIN(RADIANS(loc.latitude - rl.ref_lat) / 2), 2) +
    COS(RADIANS(rl.ref_lat)) * COS(RADIANS(loc.latitude)) *
    POWER(SIN(RADIANS(loc.longitude - rl.ref_lon) / 2), 2)
  )) AS distance_km
FROM listings l
JOIN locations loc ON l.location_id = loc.id
JOIN renter_location rl ON TRUE
WHERE l.is_active = true
ORDER BY distance_km LIMIT 50;
