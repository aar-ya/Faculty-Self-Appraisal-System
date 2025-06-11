from datetime import datetime

class AppraisalEntry:
    def __init__(self, parameter_no, subpoint, description, file_path, self_score, max_score):
        self.parameter_no = parameter_no     
        self.subpoint = subpoint             
        self.description = description       
        self.file_path = file_path           
        self.self_score = self_score         
        self.max_score = max_score           
        self.verified_score = None           

    def to_dict(self):
        return {
            "parameter_no": self.parameter_no,
            "subpoint": self.subpoint,
            "description": self.description,
            "file_path": self.file_path,
            "self_score": self.self_score,
            "max_score": self.max_score,
            "verified_score": self.verified_score
        }

class AppraisalForm:
    def __init__(self, employee_id, year, entries):
        self.employee_id = employee_id
        self.year = year
        self.entries = entries               
        self.total_score = sum(entry.self_score for entry in entries)
        self.submission_date = datetime.now()
        self.submitted = True                

    def to_dict(self):
        return {
            "employee_id": self.employee_id,
            "year": self.year,
            "entries": [entry.to_dict() for entry in self.entries],
            "total_score": self.total_score,
            "submission_date": self.submission_date,
            "submitted": self.submitted
        }
