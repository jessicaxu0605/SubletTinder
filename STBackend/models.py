from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date
from enum import Enum

class GenderEnum(str, Enum):
    male = "male"
    female = "female"
    non_binary = "non-binary"
    prefer_not_to_say = "prefer not to say"
    other = "other"

class Photo(BaseModel):
    url: str
    label: str

class ListingCreate(BaseModel):
    user_id: int
    is_active: Optional[bool] = True
    locations_id: int
    start_date: date
    end_date: date
    target_gender: GenderEnum
    asking_price: float
    building_type_id: Optional[int] = None
    num_bedrooms: int
    num_bathrooms: int
    pet_friendly: bool
    utilities_incl: bool
    description: Optional[str] = None
    amenities: Optional[List[int]] = []
    photos: Optional[List[Photo]] = []

class UserCreate(BaseModel):
    id: int
    first_name: str
    last_name: str
    password: str = Field(..., min_length=8)
    email: EmailStr
    profile_photo: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    profile_photo: Optional[str] = None
