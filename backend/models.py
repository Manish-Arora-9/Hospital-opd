from pydantic import BaseModel
from typing import Optional, Dict

class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    dob: Optional[str]
    gender: Optional[str]
    contact_info: Optional[Dict]
    address: Optional[str]
    registration_date: Optional[str]
    blood_group: Optional[str]
    city: Optional[str]
    state: Optional[str]
    pincode: Optional[str]
    allergies: Optional[str]
    chronic_diseases: Optional[str]
    medications: Optional[str]
    emergency_name: Optional[str]
    emergency_relation: Optional[str]
    emergency_phone: Optional[str]
    age: Optional[int]