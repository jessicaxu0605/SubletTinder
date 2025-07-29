create table if not exists users (
    id bigserial primary key,
    first_name varchar(255) not null,
    last_name varchar(255) not null,
    password varchar(255) not null,
    email varchar(255) not null unique,
    profile_photo text
);

create index if not exists idx_users_email on users(email);

create table if not exists locations (
    id bigserial primary key,
    places_api_id bigint not null,
    address_string varchar(255) not null,
    longitude decimal(7,4) not null,
    latitude decimal(7,4) not null
);

create index if not exists idx_locations_places_api_id on locations(places_api_id);
create index if not exists idx_locations_coords on locations(latitude, longitude);

create table if not exists building_types (
    id serial primary key,
    type varchar(255) not null unique
);

create table if not exists amenities (
    id serial primary key,
    name varchar(255) not null unique
);

create type gender_enum as enum ('male', 'female', 'nonbinary', 'other', 'prefer not to say');

create table if not exists listings (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    is_active boolean not null default true,
    locations_id bigint not null references locations(id) on delete cascade,
    start_date date not null,
    end_date date not null,
    target_gender gender_enum,
    asking_price decimal(10,2) not null,
    building_type_id int references building_types(id) on delete set null,
    num_bedrooms int not null,
    num_bathrooms int not null,
    pet_friendly boolean not null,
    utilities_incl boolean not null,
    description text,

    constraint chk_start_date_future check (
        start_date > current_date
    ),
    constraint chk_term_length check (
        end_date >= start_date + interval '1 month'
        and end_date <= start_date + interval '1 year'
    )
);

create index if not exists idx_listings_user_id on listings(user_id);
create index if not exists idx_listings_locations_id on listings(locations_id);
create index if not exists idx_listings_building_type_id on listings(building_type_id);
create index if not exists idx_listings_is_active on listings(is_active);
create index if not exists idx_listings_required_attributes on listings(is_active, user_id, num_bedrooms, start_date, end_date);

create table if not exists photos (
    listing_id bigint not null references listings(id) on delete cascade,
    url text not null,
    label varchar(255),
    primary key (listing_id, url)
);

create index if not exists idx_photos_listing_id on photos(listing_id);

create table if not exists renter_profiles (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    is_active boolean not null default true,
    locations_id bigint not null references locations(id) on delete cascade,
    start_date date not null,
    end_date date not null,
    age int not null,
    gender gender_enum not null,
    budget decimal(10,2) not null,
    building_type_id int references building_types(id) on delete set null,
    num_bedrooms int not null,
    num_bathrooms int not null,
    has_pet boolean not null,
    bio text,

    unique(user_id),
    constraint chk_start_date_future check (
        start_date > current_date
    ),
    constraint chk_term_length check (
        end_date >= start_date + interval '1 month'
        and end_date <= start_date + interval '1 year'
    ),
    constraint chk_age_min check (
        age >= 18
    )
);

create index if not exists idx_renter_profiles_user_id on renter_profiles(user_id);
create index if not exists idx_renter_profiles_locations_id on renter_profiles(locations_id);
create index if not exists idx_renter_profiles_building_type_id on renter_profiles(building_type_id);
create index if not exists idx_renter_profiles_is_active on renter_profiles(is_active);

create table if not exists renter_on_listing (
    id bigserial primary key,
    renter_profile_id bigint not null references renter_profiles(id) on delete cascade,
    listing_id bigint not null references listings(id) on delete cascade,
    is_right boolean not null,
    unique(renter_profile_id, listing_id)
);

create index if not exists idx_renter_on_listing_renter on renter_on_listing(renter_profile_id);
create index if not exists idx_renter_on_listing_listing on renter_on_listing(listing_id);
create index if not exists idx_renter_on_listing_is_right on renter_on_listing(is_right);

create table if not exists listing_on_renter (
    id bigserial primary key,
    listing_id bigint not null references listings(id) on delete cascade,
    renter_profile_id bigint not null references renter_profiles(id) on delete cascade,
    is_right boolean not null,
    unique(listing_id, renter_profile_id)
);

create index if not exists idx_listing_on_renter_listing on listing_on_renter(listing_id);
create index if not exists idx_listing_on_renter_renter on listing_on_renter(renter_profile_id);
create index if not exists idx_listing_on_renter_is_right on listing_on_renter(is_right);

create table if not exists listing_amenities (
    listing_id bigint not null references listings(id) on delete cascade,
    amenity_id int not null references amenities(id) on delete cascade,
    primary key (listing_id, amenity_id)
);

create index if not exists idx_listing_amenities_listing on listing_amenities(listing_id);
