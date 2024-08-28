// EmployeeLogin.js

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
//import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './EmployeeLogin.css';

const EmployeeLogin = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onLogin(credentials, navigate); // Pass the 'navigate' function to 'onLogin'
    } catch (error) {
      setError('Error during login. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='employeeLoginContainer'>
      <h2 className='loginBannerHeader'>Employee Login</h2>
      <form className='formDataEmployee' onSubmit={handleSubmit}>
        <label>
          Username
        </label>
        <input className="loginForm" type="text" name="username" value={credentials.username} onChange={handleChange} />
        <label>
          Password
        </label>
        <input className="loginForm" type="password" name="password" value={credentials.password} onChange={handleChange} />
        <div className='loginbtbData'>
        <button className="loginBtn" type="submit" disabled={loading}>
          {loading ? <FontAwesomeIcon icon={faLock} spin /> : 'Login'}
        </button>
        </div>
      </form>
      {error && <p>{error}</p>}
    </div>
  );
};

export default EmployeeLogin;
