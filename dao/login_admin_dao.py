from util import db_connection
from exception.custom_exceptions import UserNotFoundException

class Login_admin:
    def __init__(self):
        self.db = db_connection.get_db()

    def verify_login(self, email):
        login_collection = self.db.admin
        user = login_collection.find_one({'email': email})
        if not user:
            raise UserNotFoundException('User not found')
        return user

