import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./login/Login";
import Admin from "./Dashboard/AdminDashboard";
import Cashier from "./Dashboard/CashierDashboard";
import ProtectedRoute from "./login/ProtectedRoute";
import Pharmacist from "./Dashboard/PharmacistDashboard";

function App() {
  console.log("Login Page Loaded");
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />{" "}
        {/* Redirect "/" to login */}
        <Route path="/login" element={<Login />} />
        <Route
          path="/Admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Cashier"
          element={
            <ProtectedRoute>
              <Cashier />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Pharmacist"
          element={
            <ProtectedRoute>
              <Pharmacist />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />{" "}
        {/* Handle unknown routes */}
      </Routes>
    </Router>
  );
}

export default App;
