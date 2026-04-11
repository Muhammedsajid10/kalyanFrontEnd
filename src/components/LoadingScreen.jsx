import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ message = "Loading Kalyan Industrial Suite..." }) => {
  return (
    <div className="loading-screen-container">
      <div className="loading-content">
        <div className="industrial-loader">
          <div className="loader-ring"></div>
          <div className="loader-ring"></div>
          <div className="loader-ring"></div>
          <div className="loader-core">
            <span className="k-logo">K</span>
          </div>
        </div>
        <div className="loading-text-wrapper">
          <h2 className="loading-title">{message}</h2>
          <div className="loading-bar-track">
            <div className="loading-bar-filler"></div>
          </div>
          <p className="loading-subtitle">Optimizing workflow and stock data</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
