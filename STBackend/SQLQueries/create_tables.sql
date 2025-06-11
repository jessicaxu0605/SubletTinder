-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    profile_photo VARCHAR(1024),
);

CREATE INDEX idx_users_email ON users(email);


-- Listings table
CREATE TABLE listings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date DATE NOT NULL,
    end_date DATE,
    tenant_age INTEGER,
    tenant_gender VARCHAR(20),
    asking_price NUMERIC(12, 2) NOT NULL,
    building_type VARCHAR(50) NOT NULL,
    num_bedrooms INTEGER NOT NULL,
    num_bathrooms INTEGER NOT NULL,
    pet_friendly BOOLEAN NOT NULL DEFAULT FALSE,
    utilities_incl BOOLEAN NOT NULL DEFAULT FALSE,
    amenities TEXT,
    description TEXT,
    address TEXT NOT NULL
);

CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_is_active ON listings(is_active);
CREATE INDEX idx_listings_price ON listings(asking_price);


-- Renter Profiles table
CREATE TABLE renter_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date DATE NOT NULL,
    end_date DATE,
    age INTEGER NOT NULL,
    gender VARCHAR(20),
    budget NUMERIC(12, 2) NOT NULL,
    building_type VARCHAR(50),
    num_bedrooms INTEGER,
    num_bathrooms INTEGER,
    has_pet BOOLEAN NOT NULL DEFAULT FALSE,
    bio TEXT,
    program VARCHAR(100),
    year INTEGER
);

CREATE INDEX idx_renter_profiles_user_id ON renter_profiles(user_id);
CREATE INDEX idx_renter_profiles_is_active ON renter_profiles(is_active);
CREATE INDEX idx_renter_profiles_budget ON renter_profiles(budget);
