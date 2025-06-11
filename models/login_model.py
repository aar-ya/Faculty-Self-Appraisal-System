class Login:
    def __init__(self, name, employee_id, email, phone, password_hash, verified=False):
        self.name = name
        self.employee_id = employee_id
        self.email = email
        self.phone = phone
        self.password_hash = password_hash 
        self.verified = verified            

    def to_dict(self):
        return {
            "name": self.name,
            "employee_id": self.employee_id,
            "email": self.email,
            "phone": self.phone,
            "password_hash": self.password_hash,
            "verified": self.verified
        }