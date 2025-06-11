from pymongo import MongoClient

def get_db():
    try:
        client = MongoClient("mongodb://localhost:27017/")
        db = client["college_app"]
        return db
    except Exception as e:
        print("Database connection error:", e)
        return None
