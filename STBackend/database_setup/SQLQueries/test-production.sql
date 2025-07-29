-- Feature 1: Add Listing
INSERT INTO listings (
            user_id, is_active, locations_id, start_date, end_date,
            target_gender, asking_price, building_type_id,
            num_bedrooms, num_bathrooms, pet_friendly,
            utilities_incl, description
        ) VALUES (
            1, true, 3, '2025-09-01', '2025-12-31', 
            'female', 3000, 35, 
            3, 3, true, 
            true, 'Spacious property, beautifully maintained')
        RETURNING id;

INSERT INTO listing_amenities (listing_id, amenity_id)
VALUES (1001, 27), (1001, 43), (1001, 28);

INSERT INTO photos (listing_id, url, label)
VALUES (1001, 'https://cdn.realtor.ca/listing/TS638841952853000000/reb82/highres/0/x12183690_4.jpg', 'exterior');

-- Feature 2: Update Listing
UPDATE listings
SET is_active = FALSE
WHERE id = 1001 AND user_id = 1 RETURNING *;

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
WHERE l.id = 1001

-- Feature 4: User signup/login

-- user signup
INSERT INTO users (email, first_name, last_name, password, profile_photo) 
VALUES (
    'a642shar@uwaterloo.ca', 
    'Anika',
    'Sharma',
    '$2b$12$5/EUu',
    null
    )
    RETURNING id;

-- user login - searches users table for user with matching email (if any)
SELECT id, email, password, first_name, last_name, profile_photo FROM users WHERE email = 'a642shar@uwaterloo.ca';

-- Feature 5: Delete user
DELETE from users WHERE id = 1001 RETURNING *;

-- Advanced Feature 5: Collaborative filtering
WITH
  current_likes AS (
    SELECT listing_id
    FROM renter_on_listing
    WHERE renter_profile_id = 1038
      AND is_right = TRUE
  ),

  similar_renters AS (
    SELECT
      rol2.renter_profile_id,
      COUNT(*) AS common_likes
    FROM renter_on_listing AS rol1
    JOIN renter_on_listing AS rol2
      ON rol1.listing_id = rol2.listing_id
      AND rol2.is_right = TRUE
    WHERE rol1.renter_profile_id = 1038
      AND rol1.is_right = TRUE
      AND rol2.renter_profile_id != 1038
    GROUP BY rol2.renter_profile_id
    HAVING COUNT(*) >= 1
  ),

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

SELECT
  l.*,
  sr.score
FROM scored_recs AS sr
JOIN listings AS l
  ON l.id = sr.listing_id
WHERE l.is_active = TRUE
ORDER BY sr.score DESC, l.start_date ASC
LIMIT 10;

CREATE INDEX idx_renter_on_listing_rp_isright
  ON renter_on_listing(renter_profile_id, is_right);

CREATE INDEX idx_renter_on_listing_listing_isright
  ON renter_on_listing(listing_id, is_right);
