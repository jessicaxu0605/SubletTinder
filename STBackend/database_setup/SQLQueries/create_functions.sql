CREATE OR REPLACE FUNCTION get_listing_candidates(renter_id bigint)
RETURNS TABLE (
    id bigint,
    is_active boolean,
    asking_price numeric,
    num_bedrooms integer,
    num_bathrooms integer,
    start_date date,
    end_date date,
    pet_friendly boolean,
    utilities_incl boolean,
    locations_id bigint,
    building_type_id integer,
    target_gender gender_enum,
    address_string character varying(255),
    distance_km double precision
) AS $$
BEGIN
    RETURN QUERY
    WITH base AS (
        SELECT
            l.id,
            l.is_active,
            l.asking_price,
            l.num_bedrooms,
            l.num_bathrooms,
            l.start_date,
            l.end_date,
            l.pet_friendly,
            l.utilities_incl,
            l.locations_id,
            l.building_type_id,
            l.target_gender,
            loc.address_string,
            6371 * 2 * ASIN(SQRT(
                POWER(SIN(RADIANS(loc.latitude - loc_ref.latitude) / 2), 2) +
                COS(RADIANS(loc_ref.latitude)) * COS(RADIANS(loc.latitude)) *
                POWER(SIN(RADIANS(loc.longitude - loc_ref.longitude) / 2), 2)
            )) AS distance_km
        FROM listings l
        JOIN renter_profiles r ON r.id = renter_id
        JOIN locations loc_ref ON r.locations_id = loc_ref.id
        JOIN locations loc ON l.locations_id = loc.id
        WHERE l.is_active
          AND l.user_id != r.user_id
          AND l.num_bedrooms >= r.num_bedrooms
          AND r.start_date >= l.start_date - 15
          AND r.end_date <= l.end_date + 15
          AND (NOT r.has_pet OR l.pet_friendly)
          AND NOT EXISTS (
              SELECT 1 FROM renter_on_listing rol
              WHERE rol.renter_profile_id = renter_id
                AND rol.listing_id = l.id
          )
          AND NOT EXISTS (
              SELECT 1 FROM listing_on_renter lor
              WHERE lor.listing_id = l.id
                AND lor.renter_profile_id = renter_id
          )
    )
    SELECT * FROM base
    WHERE base.distance_km < 50;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_renter_candidates(listing_id bigint)
RETURNS TABLE (
    id bigint,
    is_active boolean,
    budget numeric,
    num_bedrooms integer,
    num_bathrooms integer,
    start_date date,
    end_date date,
    has_pet boolean,
    utilities_incl boolean,
    locations_id bigint,
    building_type_id integer,
    gender gender_enum,
    address_string character varying(255),
    distance_km double precision
) AS $$
BEGIN
    RETURN QUERY
    WITH base AS (
        SELECT
            r.id,
            r.is_active,
            r.budget,
            r.num_bedrooms,
            r.num_bathrooms,
            r.start_date,
            r.end_date,
            r.has_pet,
            r.utilities_incl,
            r.locations_id,
            r.building_type_id,
            r.gender,
            loc.address_string,
            6371 * 2 * ASIN(SQRT(
                POWER(SIN(RADIANS(loc.latitude - loc_ref.latitude) / 2), 2) +
                COS(RADIANS(loc_ref.latitude)) * COS(RADIANS(loc.latitude)) *
                POWER(SIN(RADIANS(loc.longitude - loc_ref.longitude) / 2), 2)
            )) AS distance_km
        FROM renter_profiles r
        JOIN listings l ON l.id = listing_id
        JOIN locations loc_ref ON l.locations_id = loc_ref.id
        JOIN locations loc ON r.locations_id = loc.id
        WHERE r.is_active
          AND l.user_id != r.user_id
          AND l.num_bedrooms >= r.num_bedrooms
          AND r.start_date >= l.start_date - 15
          AND r.end_date <= l.end_date + 15
          AND (NOT r.has_pet OR l.pet_friendly)
          AND NOT EXISTS (
              SELECT 1 FROM renter_on_listing rol
              WHERE rol.renter_profile_id = r.id
                AND rol.listing_id = l.id
          )
          AND NOT EXISTS (
              SELECT 1 FROM listing_on_renter lor
              WHERE lor.listing_id = r.id
                AND lor.renter_profile_id = l.id
          )
    )
    SELECT * FROM base
    WHERE base.distance_km < 50;
END;
$$ LANGUAGE plpgsql;
