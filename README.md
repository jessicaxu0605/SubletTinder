# 🏠 SubletTinder

# Milestone 3
## Where to find C2 and C3
The SQL code we used for creating our tables, views, triggers, and functions is under the path `STBackend/database_setup/SQLQueries/`. You can also find test-sample.sql and test-production.sql, along with their corresponding output files in this directory.

## How to create/load the sample database
Our database is hosted on the cloud using Neon, simply follow the steps below to run a local backend server which will automatically connect you to the database.

## How to generate the "production" dataset and load into database
The full Production dataset is in `STBackend/data/prod.xlsx`. The data is already loaded into our Neon production database; the connection string for this can be found at the end of our report. The python script used to load the data in `prod.xlsx` can be found at `STBackend/data/insert_data.ipynb`. Running all blocks in the jupyter notebook will clean then re-populate the production database on Neon.

## 💡 Current Features
The following is a list of all of the features in our report and where they can be found in our repository.
### Basic
- R6: Add a listing: `STBackend/routes/listings.py`
- R7: Deactivate a listing: `STBackend/routes/listings.py`
- R8: Get details of a listing: `STBackend/routes/listings.py`
- R9: User signup and login: `STBackend/routes/auth.py`
- R10: Delete a user: `STBackend/routes/users.py`

### Advanced
- R11: Function to build top 50 potential listings: `STBackend/database_setup/SQLQueries/create_functions.sql`
- R12: Rank and retrieve 50 listing candidates (extension of R11): `STBackend/routes/listings.py`
- R13: Trigger to delete swipes on listing deactivate: `STBackend/database_setup/SQLQueries/deactivate_functions.sql`
- R14: View that generates mutual matches: `STBackend/database_setup/SQLQueries/create_view.sql`
- R15: Suggest listings based on user swipe patterns: `STBackend/routes/listings.py`

## 🛠️ How to run the backend
1. Clone the repo into your local machine.
```
git clone https://github.com/jessicaxu0605/SubletTinder.git
```

2. Navigate into the STBackend directory.
```
cd SubletTinder/STBackend
```

3. (Optional) Make a virtual env and activate it
```
python -m venv venv
```
   Mac: `source venv/bin/activate`
   
   Windows: `.\venv\Scripts\activate`

4. Install dependencies
```
pip install -r requirements.txt
```

5. Create an environment (.env) file in the STBackend directory. It should have the following:
```
// replace the placeholders with the variables at the end of the Milestone 3 report
DATABASE_URL=your_database_url 
GOOGLE_API_KEY=your_google_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

6. To test the features (backend only):
- Run `uvicorn server:app --reload` 
- Navigate to `http://127.0.0.1:8000/docs` in your browser. This will open up the Swagger UI which is used as an interactive interface to test endpoints.

## 👩‍💻 How to run the frontend
### ❗️Important
Expo Go is used to test the frontend mobile application. Download the Expo Go app from the App Store or Google Play Store before proceeding.

Ngrok is used to setup a tunnel to allow the frontend and backend to communicate over localhost. Install ngrok and start a tunnel before proceeding (quickstart instructions can be found here: https://ngrok.com/docs/getting-started/)

### To set up the frontend:
1. Make sure the backend server has been started (follow the steps above).
2. Open a new terminal and navigate into the `STFrontend` directory.
4. Run the following command to install dependencies
```
npm install
```
4. In the frontend directory, open the file at `STFrontend/lib/api.ts`. Replace the `BASE_URL` with your ngrok address.
5. Start the expo server by entering in your terminal:
```
npx expo start --clear
```
6. Scan the QR code on your phone, which will open up the Expo Go app. Wait for the app to load, and you are now able to test the frontend.
