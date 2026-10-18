
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from data_structures import PriorityQueue, BinarySearchTree, LinkedList

app = FastAPI(title="Emergency Patient Management System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

patients = {}
waiting = PriorityQueue()
patient_tree = BinarySearchTree()
history = LinkedList()
next_id = 1001


class PatientInput(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    age: int = Field(ge=0, le=120)
    emergency_level: int = Field(ge=1, le=3)
    symptoms: str = Field(min_length=2, max_length=300)


@app.get("/")
def home():
    return {"message": "Emergency Patient Management API is running"}


@app.get("/api/patients")
def get_patients():
    return list(patients.values())


@app.post("/api/patients")
def register_patient(data: PatientInput):
    global next_id

    patient = {
        "patient_id": next_id,
        "name": data.name,
        "age": data.age,
        "emergency_level": data.emergency_level,
        "symptoms": data.symptoms,
        "status": "Waiting",
    }

    patients[next_id] = patient
    patient_tree.insert(patient)
    waiting.enqueue(patient)
    next_id += 1

    return patient


@app.get("/api/patients/{patient_id}")
def search_patient(patient_id: int):
    patient = patient_tree.search(patient_id)

    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")

    return patient


@app.delete("/api/patients/{patient_id}")
def cancel_patient(patient_id: int):
    patient = patient_tree.search(patient_id)

    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")

    if patient["status"] != "Waiting":
        raise HTTPException(
            status_code=400,
            detail="Only waiting patients can be cancelled",
        )

    patient["status"] = "Cancelled"
    return {"message": "Patient registration cancelled", "patient": patient}


@app.post("/api/treat-next")
def treat_next():
    patient = waiting.dequeue()

    if patient is None:
        raise HTTPException(status_code=404, detail="No waiting patients")

    patient["status"] = "Treated"
    history.append(patient)

    return {"message": "Patient treatment recorded", "patient": patient}


@app.get("/api/history")
def get_history():
    return history.get_all()
