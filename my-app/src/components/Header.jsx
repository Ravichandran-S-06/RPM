import React, { useState } from "react";

import "./Header.css";
import logo from "../assets/logo.png"; // Ensure you have a logo image

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed-header">
      <div className="header-content">
        <img src={logo} alt="Logo" className="header-logo" />
        
        
      </div>
    </header>
  );
};

export default Header;
