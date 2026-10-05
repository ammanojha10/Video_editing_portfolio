import React, { useState } from 'react';
import { Menu, X, Moon, Sun } from 'lucide-react';

export default function Navbar({ theme, toggleTheme }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="navbar">
      <div className="container nav-content">
        <a href="#" className="nav-brand">Track My Specs</a>
        
        <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle Navigation">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`nav-links ${isOpen ? 'open' : ''}`}>
          <a href="#how-it-works" className="nav-link" onClick={() => setIsOpen(false)}>How It Works</a>
          <a href="#features" className="nav-link" onClick={() => setIsOpen(false)}>Features</a>
          <a href="#project" className="nav-link" onClick={() => setIsOpen(false)}>Project</a>
          
          <button className="btn" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          <a href="#device-control" className="btn btn-primary" onClick={() => setIsOpen(false)}>
            Connect
          </a>
        </div>
      </div>
    </nav>
  );
}
