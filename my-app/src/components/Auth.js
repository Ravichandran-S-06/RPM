import React, { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const Auth = ({ isSignUp }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignUp) {
      if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      if (password.length < 6) {
        alert("Password must be at least 6 characters");
        return;
      }
    }

    try {
      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        alert("✅ Account created successfully! You can sign in now.");
        navigate("/");
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);

        if (userCredential.user.email === "admin@vvce.ac.in") {
          navigate("/hod-dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email to reset password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("🔄 Password reset email sent! Check your inbox.");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isSignUp ? "Create an account" : "Welcome back"}</h2>
        <p>{isSignUp ? "Sign up to start managing your research papers" : "Sign in to continue to your dashboard"}</p>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                placeholder="Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={isSignUp}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@vvce.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={isSignUp ? "Password must be at least 6 characters" : "Password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isSignUp ? 6 : undefined}
              />
              <span
                className="eye-icon"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "👁️" : "🔒"}
              </span>
            </div>
            {isSignUp && <p className="password-hint"></p>}
          </div>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? "👁️" : "🔒"}
                </span>
              </div>
            </div>
          )}

          {!isSignUp && (
            <div className="forgot-password">
              <button type="button" onClick={handleForgotPassword}>
                Forgot Password?
              </button>
            </div>
          )}

          <button type="submit">{isSignUp ? "Create Account" : "Sign In"}</button>

          {!isSignUp && (
            <div className="signup-link">
              Don't have an account? <a href="/signup">Sign up</a>
            </div>
          )}

          {isSignUp && (
            <div className="signin-link">
              Already have an account? <a href="/login">Sign in</a>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Auth;
