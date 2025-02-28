import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import HODDashboard from "./components/HODDashboard";
import Home from "./components/Home";
import ProtectedRoute from "./components/ProtectedRoute";


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth isSignUp={false} />} />
        <Route path="/signup" element={<Auth isSignUp={true} />} />
        <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
        <Route path="/hod-dashboard" element={
            <ProtectedRoute>
              <HODDashboard />
            </ProtectedRoute>
          } />
      </Routes>
    </Router>
  );
};

export default App;
