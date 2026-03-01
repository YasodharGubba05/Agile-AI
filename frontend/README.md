# AgileAI Frontend

React frontend for AgileAI - AI-assisted Agile Project Management Platform.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Create `.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The app will open at `http://localhost:3000`

## Features

- User authentication (Login/Signup)
- Project management dashboard
- Sprint planning with AI recommendations
- Task management
- Risk analysis dashboard
- Evaluation metrics
- Sprint retrospectives

## Components

- `components/Navbar.js` - Navigation bar
- `components/PrivateRoute.js` - Protected route wrapper
- `pages/` - All page components
- `context/AuthContext.js` - Authentication context
- `services/api.js` - API service with axios
