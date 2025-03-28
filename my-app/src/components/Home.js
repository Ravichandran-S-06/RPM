import React from "react";
import { Link } from "react-router-dom";
import "./Home.css"; // Import the CSS file

const Home = () => {
  return (
    <div>
    
      

      {/* Hero Section */}
      <div className="hero">
        <h1>Streamline Your Research Paper Management</h1>
        <p>
          A beautifully designed platform for college to organize, track, 
          and collaborate on academic research papers.
        </p>
        <div className="hero-buttons">
          <Link to="/signup" className="get-started">Sign Up →</Link>
          <Link to="/login" className="sign-in">Sign In</Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="features">
        <div className="features-container">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Feature list
const features = [
  {
    icon: "📑",
    title: "Paper Organization",
    description: "Keep all your research papers organized in one place with intuitive categorization.",
  },
  {
    icon: "✅",
    title: "Progress Tracking",
    description: "Track the status of each paper from draft to publication with visual indicators.",
  },
  
];

export default Home;
