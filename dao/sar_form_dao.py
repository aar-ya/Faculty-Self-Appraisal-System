from util import db_connection

class SARFormDAO:
    def __init__(self):
        self.db = db_connection.get_db()

    def add_sar_form(self, data):
        sar_collection = self.db.self_appraisal_forms
        result= sar_collection.insert_one(data)
        return result
