import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TrainingData.css';

const TrainingData = ({ onLogin, setAdminAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('Login success');
        setAdminAuthenticated(true);
        onLogin(); // Notify parent component about successful login
        navigate(`/employeeProfile/${data.profile.id}`);
      } else {
        console.log('Login error', data.message);
        // You can provide user feedback here (e.g., display an error message)
      }
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  return (
    <div className="loginSection">
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <label className='labelAdmin'>
          UserName:
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <br />
        <label className='labelAdmin'>
          Password:
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <br />
        <button type="submit" className="loginBtn">Login</button>
      </form>
    </div>
  );
};

export default TrainingData;
