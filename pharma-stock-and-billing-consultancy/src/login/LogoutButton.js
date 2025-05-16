import React from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // Assuming you have a CSS file for styling
const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear user session data (e.g., token)
    localStorage.removeItem("token"); // Assuming token is stored in localStorage
    localStorage.removeItem("user"); // Optional: Clear user details if stored

    // Redirect to login page
    navigate("/login");
  };

  return (
    <button className="logout-button" onClick={handleLogout}>
      Logout
    </button>
  );
};

export default LogoutButton;
