create table if not exists users (
    id bigserial primary key,
    first_name varchar(255) not null,
    last_name varchar(255) not null,
    password varchar(255) not null,
    email varchar(255) not null unique,
    profile_photo text
);

create index if not exists idx_users_email on users(email);

create table if not exists location (
    id bigserial primary key,
    places_api_id bigint not null,
    address_string varchar(255) not null,
    longitude decimal(7,4) not null,
    latitude decimal(7,4) not null
);

create index if not exists idx_location_places_api_id on location(places_api_id);
create index if not exists idx_location_coords on location(latitude, longitude);

create table if not exists building_types (
    id serial primary key,
    type varchar(255) not null unique
);

create table if not exists amenities (
    id serial primary key,
    name varchar(255) not null unique
);

create table if not exists listings (
    id bigserial primary key,
    user_id bigint not null references users(id),
    is_active boolean not null default true,
    location_id bigint not null references location(id),
    start_date date not null,
    end_date date not null,
    tenant_age int not null,
    tenant_gender gender_enum not null,
    asking_price decimal(10,2) not null,
    building_type_id int references building_types(id),
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
    ),
    constraint chk_tenant_age_min check (
        tenant_age >= 18
    )
);

create index if not exists idx_listings_user_id on listings(user_id);
create index if not exists idx_listings_location_id on listings(location_id);
create index if not exists idx_listings_building_type_id on listings(building_type_id);

create table if not exists photos (
    listing_id bigint not null references listings(id),
    url text not null,
    label varchar(255),
    primary key (listing_id, url)
);

create index if not exists idx_photos_listing_id on photos(listing_id);

create table if not exists renter_profiles (
    id bigserial primary key,
    user_id bigint not null references users(id),
    is_active boolean not null default true,
    location_id bigint not null references location(id),
    start_date date not null,
    end_date date not null,
    age int not null,
    gender gender_enum not null,
    budget decimal(10,2) not null,
    building_type_id int references building_types(id),
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
create index if not exists idx_renter_profiles_location_id on renter_profiles(location_id);
create index if not exists idx_renter_profiles_building_type_id on renter_profiles(building_type_id);

create table if not exists renter_on_listing (
    id bigserial primary key,
    renter_profile_id bigint not null references renter_profiles(id),
    listing_id bigint not null references listings(id),
    is_right boolean not null,
    unique(renter_profile_id, listing_id)
);

create index if not exists idx_renter_on_listing_renter on renter_on_listing(renter_profile_id);
create index if not exists idx_renter_on_listing_listing on renter_on_listing(listing_id);
create index if not exists idx_renter_on_listing_is_right on renter_on_listing(is_right);

create table if not exists listing_on_renter (
    id bigserial primary key,
    listing_id bigint not null references listings(id),
    renter_profile_id bigint not null references renter_profiles(id),
    is_right boolean not null,
    unique(listing_id, renter_profile_id)
);

create index if not exists idx_listing_on_renter_listing on listing_on_renter(listing_id);
create index if not exists idx_listing_on_renter_renter on listing_on_renter(renter_profile_id);
create index if not exists idx_listing_on_renter_is_right on listing_on_renter(is_right);

create table if not exists listing_amenities (
    listing_id bigint not null references listings(id),
    amenity_id int not null references amenities(id),
    primary key (listing_id, amenity_id)
);

create index if not exists idx_listing_amenities_listing on listing_amenities(listing_id);
