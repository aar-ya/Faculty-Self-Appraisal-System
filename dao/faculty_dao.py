from bson.objectid import ObjectId
from util import db_connection
from exception.custom_exceptions import UserAlreadyExistsException, UserNotFoundException

class FacultyDAO:
    def __init__(self):
        self.db = db_connection.get_db()
        self.faculty_collection = self.db.faculty  # Initialize collection here

    def add_faculty(self, faculty_data):
        """Add a new faculty member to the database"""
        if self.faculty_collection.find_one({'email': faculty_data.get('email')}):
            raise UserAlreadyExistsException('Faculty with this email already exists')
        result = self.faculty_collection.insert_one(faculty_data)
        return str(result.inserted_id)

    def get_user_by_id(self, user_id):
        """Retrieve faculty by ID"""
        user = self.faculty_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            raise UserNotFoundException('Faculty not found')
        return user

    def update_profile(self, user_id, **kwargs):
        """Update faculty profile information"""
        if not user_id:
            raise ValueError("User ID is required")
        
        update_data = {k: v for k, v in kwargs.items() if v is not None}
        
        if not update_data:
            raise ValueError("No data provided for update")
        
        result = self.faculty_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            raise UserNotFoundException('Faculty not found')
        
        return result.modified_count > 0

    def update_profile_picture(self, user_id, image_path):
        """Update faculty profile picture"""
        return self.update_profile(
            user_id=user_id,
            profile_picture=image_path
        )