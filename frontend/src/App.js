import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Sprints from './pages/Sprints';
import SprintDetail from './pages/SprintDetail';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Metrics from './pages/Metrics';
import AIHub from './pages/AIHub';
import ProductivityAnalysis from './pages/ProductivityAnalysis';
import AIDecisionLog from './pages/AIDecisionLog';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <PrivateRoute>
                    <Projects />
                  </PrivateRoute>
                }
              />
              <Route
                path="/projects/:id"
                element={
                  <PrivateRoute>
                    <ProjectDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/sprints"
                element={
                  <PrivateRoute>
                    <Sprints />
                  </PrivateRoute>
                }
              />
              <Route
                path="/sprints/:id"
                element={
                  <PrivateRoute>
                    <SprintDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <PrivateRoute>
                    <Tasks />
                  </PrivateRoute>
                }
              />
              <Route
                path="/tasks/:id"
                element={
                  <PrivateRoute>
                    <TaskDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/metrics/:projectId"
                element={
                  <PrivateRoute>
                    <Metrics />
                  </PrivateRoute>
                }
              />
              <Route
                path="/ai-hub"
                element={
                  <PrivateRoute>
                    <AIHub />
                  </PrivateRoute>
                }
              />
              <Route
                path="/productivity/:projectId"
                element={
                  <PrivateRoute>
                    <ProductivityAnalysis />
                  </PrivateRoute>
                }
              />
              <Route
                path="/ai-logs"
                element={
                  <PrivateRoute>
                    <AIDecisionLog />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
