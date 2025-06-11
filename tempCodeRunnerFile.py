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