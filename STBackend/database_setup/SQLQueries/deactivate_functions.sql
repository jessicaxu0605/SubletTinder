create or replace function delete_swipes_on_listing()
returns trigger as $$
begin
    delete from renter_on_listing where listing_id = old.id;
    delete from listing_on_renter where listing_id = old.id;
    return new;
end;
$$ language plpgsql;

create trigger listing_deactivation_cascade
after update on listings
for each row
when (old.is_active = true and new.is_active = false)
execute function delete_swipes_on_listing();


create or replace function delete_swipes_on_renter()
returns trigger as $$
begin
    delete from renter_on_listing where renter_profile_id = old.id;
    delete from listing_on_renter where renter_profile_id = old.id;
    return new;
end;
$$ language plpgsql;

create trigger renter_deactivation_cascade
after update on renter_profiles
for each row
when (old.is_active = true and new.is_active = false)
execute function delete_swipes_on_renter();
