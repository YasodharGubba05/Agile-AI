# Quick Start Guide - Running AgileAI

## Prerequisites

Before starting, make sure you have:
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** installed and running - [Download here](https://www.mongodb.com/try/download/community)
  - Or use MongoDB Atlas (cloud) - [Sign up here](https://www.mongodb.com/cloud/atlas)

## Step-by-Step Instructions

### 1. Start MongoDB

**Option A: Local MongoDB**
```bash
# On macOS/Linux, start MongoDB service:
mongod

# Or if installed via Homebrew:
brew services start mongodb-community

# On Windows, MongoDB usually runs as a service automatically
```

**Option B: MongoDB Atlas (Cloud)**
- Sign up at MongoDB Atlas
- Create a free cluster
- Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/agileai`)

### 2. Setup Backend

Open a terminal and run:

```bash
# Navigate to backend directory
cd backend

# Install dependencies (first time only)
npm install

# Create .env file
# Copy the example file and edit it:
cp .env.example .env

# Edit .env file with your MongoDB URI
# For local MongoDB: mongodb://localhost:27017/agileai
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/agileai
```

**Edit `.env` file:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/agileai
JWT_SECRET=your_super_secret_jwt_key_change_in_production
NODE_ENV=development
```

**Start the backend server:**
```bash
# Development mode (with auto-reload)
npm run dev

# OR production mode
npm start
```

You should see:
```
MongoDB connected successfully
Server running on port 5000
```

✅ **Backend is now running on http://localhost:5000**

### 3. Setup Frontend

Open a **NEW terminal window** (keep backend running) and run:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Start the React app
npm start
```

The browser should automatically open to `http://localhost:3000`

✅ **Frontend is now running on http://localhost:3000**

## Running Both Together

You need **TWO terminal windows**:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## First Time Setup Summary

1. ✅ Install Node.js
2. ✅ Install and start MongoDB
3. ✅ Backend: `cd backend && npm install && npm run dev`
4. ✅ Frontend: `cd frontend && npm install && npm start`
5. ✅ Open browser to http://localhost:3000

## Testing the Application

1. **Sign Up**: Create a new account (choose PM or Developer role)
2. **Login**: Use your credentials to log in
3. **Create Project** (PM only): Go to Projects → New Project
4. **Create Sprint** (PM only): Go to Sprints → New Sprint (you'll see AI recommendations!)
5. **Create Task** (PM only): Go to Tasks → New Task (AI will suggest priority!)

## Troubleshooting

### Backend Issues

**"MongoDB connection error"**
- Make sure MongoDB is running: `mongod` or check MongoDB service
- Verify MongoDB URI in `.env` file is correct
- For MongoDB Atlas, make sure your IP is whitelisted

**"Port 5000 already in use"**
- Change PORT in `.env` file to another port (e.g., 5001)
- Update frontend `.env` if you created one: `REACT_APP_API_URL=http://localhost:5001/api`

**"Cannot find module"**
- Run `npm install` in the backend directory again

### Frontend Issues

**"Cannot connect to API"**
- Make sure backend is running on port 5000
- Check browser console for errors
- Verify CORS is enabled (it should be by default)

**"Port 3000 already in use"**
- React will ask if you want to use another port (usually 3001)
- Or manually set: `PORT=3001 npm start`

**"Module not found"**
- Run `npm install` in the frontend directory again

## Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/agileai
JWT_SECRET=your_super_secret_jwt_key_change_in_production
NODE_ENV=development
```

### Frontend (.env) - Optional
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Stopping the Servers

- **Backend**: Press `Ctrl + C` in the backend terminal
- **Frontend**: Press `Ctrl + C` in the frontend terminal

## Next Steps

- Read the main `README.md` for detailed documentation
- Check `backend/README.md` for backend-specific info
- Check `frontend/README.md` for frontend-specific info

---

**Need Help?** Check the main README.md for more detailed information about the project architecture and features.
