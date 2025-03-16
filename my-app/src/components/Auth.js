import React, { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import eye icons
import "./Auth.css"; // Import CSS file

const Auth = ({ isSignUp }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
  
      const loggedInUser = userCredential?.user; // Ensure `user` exists
  
      if (loggedInUser?.email === "admin@vvce.ac.in") {
        navigate("/hod-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      alert("Please enter your email to reset your password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent! Check your inbox.");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>{isSignUp ? "Sign Up" : "Login"}</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <div className="password-container">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <button type="submit">{isSignUp ? "Sign Up" : "Login"}</button>
      </form>
      {!isSignUp && <button className="reset-btn" onClick={handlePasswordReset}>Forgot Password?</button>}
    </div>
  );
};

export default Auth;
