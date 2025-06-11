from pymongo import MongoClient
from models.appraisal_model import AppraisalForm
from util.db_connection import get_db

class AppraisalDAO:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db["self_appraisal_forms"]

    def save_form(self, appraisal_form: AppraisalForm):
        # Prevent duplicate submission for the same year
        if self.collection.find_one({"employee_id": appraisal_form.employee_id, "year": appraisal_form.year}):
            raise Exception("Self-Appraisal Form already submitted for this year.")

        form_dict = appraisal_form.to_dict()
        self.collection.insert_one(form_dict)
        return True

    def get_forms_by_employee_id(self, employee_id):
        return list(self.collection.find({"employee_id": employee_id}))

    def get_form_by_year(self, employee_id, year):
        return self.collection.find_one({"employee_id": employee_id, "year": year})
