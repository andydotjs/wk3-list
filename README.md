# list.it

A simple web app for managing multiple lists and their items. Data is stored locally in the browser using localStorage, with user consent required.

## Features

- Create, edit (inline), and delete lists
- Add, edit (inline), and delete items within lists
- Inline editing: Click on text to edit, save on Enter or clicking away
- Data persistence with user consent for localStorage
- Consent pop-up on first visit

## Running Locally

1. Install Python (if not already installed)
2. Install dependencies: `pip install -r requirements.txt`
3. Run the app: `python app.py`
4. Open http://localhost:5000 in your browser

## Deploying to Railway

1. Push this code to a GitHub repository
2. Connect your GitHub repo to Railway
3. Railway will automatically detect the Python app and deploy it
4. Your app will be live at the provided Railway URL

## Technologies

- Frontend: HTML, CSS, JavaScript
- Backend: Python Flask (minimal, just serves static files)
- Storage: Browser localStorage (with consent)