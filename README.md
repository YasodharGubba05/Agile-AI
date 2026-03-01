# AgileAI - AI-Assisted Agile Project Management Platform

AgileAI is a comprehensive MERN stack web application that integrates AI-driven decision support to assist project managers in sprint planning, risk detection, team performance analysis, and sprint retrospectives.

## 🎯 Project Overview

AgileAI implements a Hybrid Agile–AI Project Management Framework where AI acts as a decision-support system (not an autonomous controller). All AI outputs are explainable and human-overridable, ensuring human-in-the-loop control.

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT Authentication
- Simple ML models (Linear Regression, Decision Trees, Rule-based AI)

**Frontend:**
- React (Functional Components)
- React Router
- Axios for API calls
- Basic CSS (no UI frameworks)

**AI/ML:**
- ml-regression (Linear Regression)
- decision-tree-js (Decision Trees)
- Rule-based AI for task prioritization

## 📁 Project Structure

```
SE project/
├── backend/
│   ├── models/          # MongoDB schemas (User, Project, Sprint, Task)
│   ├── routes/          # Express routes
│   ├── controllers/     # Business logic
│   ├── services/ai/     # AI/ML services
│   ├── middleware/      # Auth middleware
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service
│   │   ├── context/     # React context (Auth)
│   │   └── App.js       # Main app component
│   └── public/          # Static files
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd "SE project"
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**

   Create `backend/.env` file:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/agileai
   JWT_SECRET=your_super_secret_jwt_key_change_in_production
   NODE_ENV=development
   ```

   Create `frontend/.env` file (optional):
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

### Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   Server runs on `http://localhost:5000`

3. **Start Frontend**
   ```bash
   cd frontend
   npm start
   ```
   App runs on `http://localhost:3000`

## 👥 User Roles

### Project Manager (PM)
- Create and manage projects
- Create sprints and assign tasks
- View AI recommendations
- Accept/reject AI suggestions
- Access risk analysis and metrics

### Developer
- View assigned tasks
- Update task status
- Log task completion

## 🤖 AI Features

### 1. AI-Assisted Sprint Planning
- **Model:** Linear Regression
- **Purpose:** Predict sprint capacity to avoid overload
- **Inputs:** Previous sprint velocity, number of tasks, average task effort, team size
- **Output:** Predicted sprint capacity, overload warning
- **Human Control:** PM can accept or override recommendations

### 2. Project Risk Prediction
- **Model:** Decision Tree Classifier (rule-based implementation)
- **Purpose:** Detect project risks early
- **Features:** Missed deadlines, task spillover rate, bug count, velocity fluctuation
- **Output:** Risk Level (Low/Medium/High) with explanation
- **Human Control:** Risk analysis is informational; PM makes decisions

### 3. AI-Based Task Priority Recommendation
- **Model:** Rule-based AI
- **Purpose:** Suggest optimal task priorities
- **Factors:** Deadline proximity, task complexity, dependency count, estimated effort
- **Output:** Suggested priority (High/Medium/Low) with explanation
- **Human Control:** PM/Developer can accept or override

### 4. AI-Driven Sprint Retrospective
- **Model:** Template-based analysis
- **Purpose:** Generate insights for continuous improvement
- **Metrics:** Planned vs actual velocity, completion rates, effort estimation accuracy
- **Output:** Insights and recommendations
- **Human Control:** Informational only; team decides actions

## 📊 Evaluation Metrics

The platform tracks and displays:
- **Sprint Predictability:** Accuracy of planned vs actual sprints
- **Risk Detection Timing:** Early identification of project risks
- **Velocity Stability:** Consistency of team velocity
- **Task Completion Rate:** Percentage of completed tasks

## 🔐 Authentication & Authorization

- JWT-based authentication
- Role-based access control (RBAC)
- Protected routes for PM-only features
- Token stored in localStorage

## 🧪 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Projects
- `GET /api/projects` - Get all projects (filtered by role)
- `POST /api/projects` - Create project (PM only)
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project (PM only)
- `DELETE /api/projects/:id` - Delete project (PM only)

### Sprints
- `GET /api/sprints` - Get all sprints
- `POST /api/sprints` - Create sprint (PM only)
- `GET /api/sprints/:id` - Get sprint details
- `PUT /api/sprints/:id` - Update sprint (PM only)
- `POST /api/sprints/:id/complete` - Complete sprint (PM only)
- `POST /api/sprints/:sprintId/ai-recommendation` - Accept/reject AI recommendation (PM only)

### Tasks
- `GET /api/tasks` - Get all tasks (filtered by role)
- `POST /api/tasks` - Create task (PM only)
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task (PM only)
- `POST /api/tasks/:taskId/ai-priority` - Accept/reject priority recommendation

### AI Services
- `GET /api/ai/risk/:projectId` - Predict project risk (PM only)
- `GET /api/ai/retrospective/:sprintId` - Generate sprint retrospective (PM only)
- `GET /api/ai/metrics/:projectId` - Get evaluation metrics (PM only)

## 🎨 Key Features

### Human-in-the-Loop Controls
- Every AI recommendation requires explicit user acceptance
- All AI decisions are logged
- No automatic actions without human approval
- Clear explanations for all AI outputs

### Explainable AI
- All AI models provide explanations
- Feature importance shown where applicable
- Transparent decision-making process

### Clean Architecture
- Separation of concerns (MVC pattern)
- Reusable components
- Proper error handling
- Scalable structure

## 📝 Data Models

### User
- name, email, password, role (PM/Developer), assignedProjects

### Project
- name, description, teamMembers, startDate, riskScore, riskLevel, riskExplanation

### Sprint
- projectId, name, startDate, endDate, plannedVelocity, actualVelocity, aiPredictedCapacity, sprintHealthScore, status, aiRecommendation

### Task
- title, description, priority, estimatedEffort, actualEffort, status, assignedTo, sprintId, projectId, deadline, complexity, dependencyCount, bugCount

## 🛠️ Development Notes

- All AI models are simple and explainable
- No deep learning or black-box models
- Code is well-commented for academic evaluation
- Follows best practices for maintainability

## 📚 Academic Context

This project demonstrates:
- Integration of AI into traditional software development workflows
- Human-in-the-loop AI systems
- Explainable AI principles
- Clean software architecture
- Full-stack development with MERN

## ⚠️ Important Notes

- This is an academic project focused on correctness and clarity
- AI models are simplified for explainability
- No external UI frameworks used (as per requirements)
- All AI outputs require human approval

## 📄 License

This project is created for academic purposes.

## 👨‍💻 Author

Created as part of Software Engineering academic project.

---

**Note:** Make sure MongoDB is running before starting the backend server. For production deployment, update JWT_SECRET and use environment-specific configurations.
