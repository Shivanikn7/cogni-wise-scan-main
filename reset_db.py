import os
import time

db_path = os.path.join("backend", "assessments.db")

print(f"Attempting to reset database at {db_path}...")

if os.path.exists(db_path):
    try:
        os.remove(db_path)
        print("Database deleted successfully.")
        print("Please restart 'python app.py' to recreate it with the correct schema.")
    except PermissionError:
        print("ERROR: Could not delete database file. It is currently in use.")
        print("Please STOP the running 'python app.py' process (Ctrl+C) and try running this script again.")
    except Exception as e:
        print(f"An error occurred: {e}")
else:
    print("Database file does not exist. It will be created when you run 'python app.py'.")
