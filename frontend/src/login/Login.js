import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { FaEnvelope, FaLock, FaGoogle } from "react-icons/fa";
import "./Login.css";
import logo from "../assets/logo.png";
import "../Dashboard/style.css";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent!");
    } catch (error) {
      console.error("Error sending password reset email:", error.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Response Data:", data); // Debugging step

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("email", data.email); // ✅ Store email
        localStorage.setItem("role", data.role);
        console.log("Email:", data.email);
        console.log("Token in localStorage:", localStorage.getItem("token"));
        if (data.role === "Admin") {
          console.log("Admin Role Detected");
          navigate("/Admin");
        } else if (data.role === "Cashier") {
          navigate("/Cashier");
        } else if (data.role === "Pharmacist")
          navigate("/Pharmacist", { state: { email: email } });
        console.log("Login Successful");
      } else {
        console.error("Login Failed:", data.error);
      }
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <img src={logo} alt="Logo" className="login-logo" />
        <h2 className="login-title">WELCOME TO SHRI VINAYAGA MEDICALS</h2>
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          {/* Email Input */}
          <div className="login-input-container">
            <FaEnvelope className="login-icon" />
            <input
              type="email"
              className="login-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input */}
          <div className="login-input-container">
            <FaLock className="login-icon" />
            <input
              type="password"
              className="login-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Login Button */}
          <button type="submit" className="login-btn">
            Login
          </button>
        </form>

        {/* Forgot Password */}
        <button className="forgot-password-btn" onClick={handleForgotPassword}>
          Forgot Password?
        </button>
      </div>
    </div>
  );
};

export default Login;
