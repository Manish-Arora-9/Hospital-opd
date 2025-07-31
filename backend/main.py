from fastapi import FastAPI, HTTPException
from models import PatientCreate
from database import get_db_connection
import json
import os
from dotenv import load_dotenv

from fastapi.middleware.cors import CORSMiddleware

load_dotenv()
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ping")
def ping():
    return {"msg": "pong"}


@app.post("/patients/")
def register_patient(patient: PatientCreate):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO patients (
                first_name, last_name, dob, gender, contact_info, address,
                registration_date, blood_group, city, state, pincode,
                allergies, chronic_diseases, medications,
                emergency_name, emergency_relation, emergency_phone, age
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING patient_id
            """,
            (
                patient.first_name,
                patient.last_name,
                patient.dob,
                patient.gender,
                json.dumps(patient.contact_info),
                patient.address,
                patient.registration_date,
                patient.blood_group,
                patient.city,
                patient.state,
                patient.pincode,
                patient.allergies,
                patient.chronic_diseases,
                patient.medications,
                patient.emergency_name,
                patient.emergency_relation,
                patient.emergency_phone,
                patient.age,
            ),
        )
        patient_id = cur.fetchone()[0]
        conn.commit()
        return {"patient_id": patient_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()