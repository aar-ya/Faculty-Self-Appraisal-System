import os
import json
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from dao.faculty_dao import FacultyDAO
from dao.login_dao import LoginDAO
from dao.sar_form_dao import SARFormDAO
from dao.login_admin_dao import Login_admin
from exception.custom_exceptions import UserAlreadyExistsException, UserNotFoundException, InvalidCredentialsException

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads/sar_attachments'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

faculty_dao = FacultyDAO()
login_dao = LoginDAO()
sar_dao = SARFormDAO()
ad_login = Login_admin()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/demo')
def demo():
    return render_template('demo.html')

@app.route('/explore')
def explore():
    return render_template('explore.html')

@app.route('/faculty_login', methods=['GET', 'POST'])
def faculty_login():
    if request.method == 'POST':
        try:
            email = request.form['email']
            password = request.form['password']

            user = login_dao.verify_login(email)

            # DEBUG: Uncomment to inspect
            # print("User fetched from DB:", user)

            if 'password' not in user:
                raise InvalidCredentialsException("Password not found for user.")

            if not check_password_hash(user['password'], password):
                raise InvalidCredentialsException("Invalid email or password")

            # Successful login
            return render_template('faculty_dashboard.html', user=user)
        except (UserNotFoundException, InvalidCredentialsException) as e:
            return render_template('faculty_login.html', error=str(e))
        except Exception as e:
            print("Unexpected Error:", e)
            return render_template('faculty_login.html', error='Something went wrong during login')

    return render_template('faculty_login.html')

@app.route('/faculty_dashboard')
def faculty_dashboard():
    user_id = session.get('user_id')
    if 'user_id' not in session:
        return redirect(url_for('faculty_login'))

    # Fetch user info from database based on session user_id
    user = faculty_dao.get_user_by_id(user_id)  # Modify as per your DAO methods

    return render_template('faculty_dashboard.html', user=user)


@app.route('/api/get_profile')
def get_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = faculty_dao.get_user_by_id(session['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'name': user.get('name', ''),
        'emp_id': user.get('emp_id', ''),
        'email': user.get('email', ''),
        'phone': user.get('phone', ''),
        'address': user.get('address', ''),
        'department': user.get('department', ''),
        'designation': user.get('designation', ''),
        'qualification': user.get('qualification', ''),
        'specialization': user.get('specialization', '')
    })

@app.route('/api/update_profile', methods=['POST'])
def update_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    required_fields = ['name', 'phone', 'department']
    
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    try:
        faculty_dao.update_profile(
            user_id=session['user_id'],
            name=data['name'],
            phone=data['phone'],
            address=data.get('address', ''),
            department=data['department'],
            designation=data.get('designation', ''),
            qualification=data.get('qualification', ''),
            specialization=data.get('specialization', '')
        )
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/logout')
def logout():
    return redirect(url_for('faculty_login', success="Logged out successfully."))

@app.route('/admin_login', methods = ['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        try:
            email = request.form['email']
            password = request.form['password']

            user = ad_login.verify_login(email)
            if 'password' not in user:
                raise InvalidCredentialsException("Password not found for user.")

            if user["password"] == password:
                return redirect(url_for('admin_dashboard'))
            else:
                raise InvalidCredentialsException("Incorrect password")
            
        except (UserNotFoundException, InvalidCredentialsException) as e:
            return render_template('admin_login.html', error=str(e))
        
        except Exception as e:
            print("Unexpected Error:", e)
            return render_template('admin_login.html', error='Something went wrong during login')

    return render_template('admin_login.html')

@app.route('/admin_logout')
def admin_logout():
    return redirect(url_for('admin_login', success="Admin logged out successfully."))

@app.route('/admin_dashboard')
def admin_dashboard():
    # You can add session checks here if needed
    return render_template('admin_dashboard.html')
# ------------------ Signup ------------------
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        try:
            name = request.form['name']
            emp_id = request.form['emp_id']
            email = request.form['email']
            phone = request.form['phone']
            password = request.form['password']
            re_password = request.form['re_password']

            if password != re_password:
                return render_template('signup.html', error="Passwords do not match.")

            hashed_password = generate_password_hash(password)

            # Store full info in faculty collection
            faculty_data = {
                'name': name,
                'emp_id': emp_id,
                'email': email,
                'phone': phone,
                'password': hashed_password
            }
            faculty_dao.add_faculty(faculty_data)

            # Store only login info in login collection
            login_data = {
                'email': email,
                'password': hashed_password
            }
            login_dao.add_login(login_data)

            return render_template('faculty_login.html', success="Registration successful! Please login.")
        except UserAlreadyExistsException as e:
            return render_template('signup.html', error=str(e))
        except Exception as e:
            print("Unexpected Error during signup:", e)
            return render_template('signup.html', error="Something went wrong during signup.")
    else:
        return render_template('signup.html')
    

#---------------SAR FORM-----------------#
@app.route('/sar_form')
def sar_form():
    return render_template('sarform.html')

@app.route('/sar_review')
def sar_review():
    return render_template('review.html')

@app.route('/submit_sar', methods=['POST'])
def submit_sar_data():
    try:
        form_data = request.form
        files = request.files

        if not form_data:
            return jsonify({"status": "error", "message": "No form data received"}), 400

        sar_document = {}
        # Process form fields (text data)
        for key, value in form_data.items():
            # Assuming section data is sent as JSON strings with keys like 'section_feature-1'
            if key.startswith('section_'):
                try:
                    section_name = key.replace('section_', '')
                    sar_document[section_name] = json.loads(value)
                except json.JSONDecodeError:
                    sar_document[key] = value # Store as is if not valid JSON
            else:
                sar_document[key] = value
        
        # Process uploaded files
        uploaded_file_paths = {}
        for key, file_storage in files.items():
            if file_storage and file_storage.filename:
                filename = secure_filename(file_storage.filename)
                # Create a unique path for each user/submission if possible, for now just save to UPLOAD_FOLDER
                # For example: user_specific_folder = os.path.join(app.config['UPLOAD_FOLDER'], session.get('user_id', 'anonymous'))
                # os.makedirs(user_specific_folder, exist_ok=True)
                # file_path = os.path.join(user_specific_folder, filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file_storage.save(file_path)
                
                # Store relative path to be saved in DB
                # The key from JS is like 'event-file-1a', 'cert-file' etc.
                # We need to associate this file with its corresponding section/field in sar_document
                # For simplicity, storing all file paths under a 'files' key in the main document for now.
                # A more robust solution would map files to their specific form fields.
                if 'uploaded_files' not in sar_document:
                    sar_document['uploaded_files'] = {}
                sar_document['uploaded_files'][key] = file_path.replace('\\', '/') # Normalize path separators

        # TODO: Add user identification if available (e.g., from session)
        user_id = session.get('user_id')
        if user_id:
            sar_document['user_id'] = user_id
        else:
            # Handle anonymous submission or require login
            sar_document['user_id'] = 'anonymous_submission' # Placeholder

        print("Processed SAR document for saving:", json.dumps(sar_document, indent=2)) # For debugging

        result = sar_dao.add_sar_form(sar_document)
        sar_id = result.inserted_id

        return jsonify({"status": "success", "message": "SAR form submitted successfully!", "sar_id": str(sar_id)}), 200
    except Exception as e:
        # Log the full traceback for detailed debugging
        import traceback
        print(f"Error submitting SAR data: {e}\n{traceback.format_exc()}")
        return jsonify({"status": "error", "message": f"An unexpected error occurred: {str(e)}"}), 500

# ------------------ Run App ------------------
if __name__ == '__main__':
    app.run(debug=True)
