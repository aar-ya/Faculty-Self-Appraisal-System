from dao.faculty_dao import FacultyDAO
from exception.custom_exceptions import FacultyNotFoundException, DatabaseException

def test_add_faculty():
    faculty_dao = FacultyDAO()
    faculty_data = {
        "name": "Dr. John Doe",
        "email": "john.doe@university.com",
        "employee_id": "12345",
        "phone_number": "1234567890",
        "department": "Computer Science",
        "designation": "Professor"
    }
    
    try:
        result = faculty_dao.add_faculty(faculty_data)
        assert result is not None, "Faculty addition failed"
        print("Faculty added successfully!")
    except DatabaseException as e:
        print(f"Database error: {e}")

def test_get_faculty_by_id():
    faculty_dao = FacultyDAO()
    faculty_id = "12345"
    
    try:
        faculty = faculty_dao.get_faculty_by_id(faculty_id)
        assert faculty is not None, f"Faculty with ID {faculty_id} not found"
        print(f"Faculty details: {faculty}")
    except FacultyNotFoundException as e:
        print(f"Error: {e}")
    except DatabaseException as e:
        print(f"Database error: {e}")

# Run the tests
test_add_faculty()
test_get_faculty_by_id()
