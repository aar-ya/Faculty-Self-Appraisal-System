class Faculty:
    def __init__(self, name, employee_id, email, phone, gender, nationality, department,
                 designation, current_address, permanent_address, same_as_current,
                 photo_url=None):
        self.name = name
        self.employee_id = employee_id
        self.email = email
        self.phone = phone
        self.gender = gender
        self.nationality = nationality
        self.department = department
        self.designation = designation
        self.current_address = current_address
        self.permanent_address = permanent_address
        self.same_as_current = same_as_current  
        self.photo_url = photo_url              

    def to_dict(self):
        return {
            "name": self.name,
            "employee_id": self.employee_id,
            "email": self.email,
            "phone": self.phone,
            "gender": self.gender,
            "nationality": self.nationality,
            "department": self.department,
            "designation": self.designation,
            "current_address": self.current_address,
            "permanent_address": self.permanent_address,
            "same_as_current": self.same_as_current,
            "photo_url": self.photo_url
        }