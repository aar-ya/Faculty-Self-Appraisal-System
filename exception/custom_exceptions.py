class CustomException(Exception):
    """Base class for all exceptions in the project."""
    def __init__(self, message):
        self.message = message
        super().__init__(self.message)

class DatabaseException(CustomException):
    """Exception raised for database related errors."""
    def __init__(self, message="Database error occurred"):
        self.message = message
        super().__init__(self.message)

class FacultyNotFoundException(DatabaseException):
    """Exception raised when faculty is not found in the database."""
    def __init__(self, message="Faculty not found in the database"):
        self.message = message
        super().__init__(self.message)

class InvalidDataException(CustomException):
    """Exception raised when invalid data is provided."""
    def __init__(self, message="Invalid data provided"):
        self.message = message
        super().__init__(self.message)

class ValidationException(CustomException):
    """Exception raised when data validation fails."""
    def __init__(self, message="Data validation failed"):
        self.message = message
        super().__init__(self.message)

class UserAlreadyExistsException(Exception):
    def __init__(self, message):
        self.message = message
        super().__init__(self.message)

class UserNotFoundException(Exception):
    def __init__(self, message):
        self.message = message
        super().__init__(self.message)

class InvalidCredentialsException(Exception):
    def __init__(self, message):
        self.message = message
        super().__init__(self.message)

