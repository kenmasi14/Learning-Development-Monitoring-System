// EmployeeAddForm.js
import React, { useState } from 'react';
import './EmployeeAddForm.css'; // Import the CSS file

const EmployeeAddForm = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [username, setUsername] = useState('');
  const [position, setPosition] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newEmployee = {
      firstName,
      lastName,
      middleName,
      position,
      profile: {
        username, // Include username in the profile object
      },
    };

    try {
      const response = await fetch('http://localhost:5000/employees/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEmployee),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccessMessage('Employee added successfully!');
          // Optionally, you can reset the form fields here
          setFirstName('');
          setLastName('');
          setMiddleName('');
          setUsername('');
          setPosition('');
        } else {
          console.error('Failed to add employee:', data.error);
          setSuccessMessage('Error adding employee. Please try again.');
        }
      } else {
        console.error('Failed to add employee. Server error.');
        setSuccessMessage('Error adding employee. Please try again.');
      }
    } catch (error) {
      // Handle the error (e.g., show an error message to the user)
      console.error('Error adding employee:', error);
      setSuccessMessage('Error adding employee. Please try again.');
    }
  };

  return (
    <div className="employee-add-form">
      <h2>Add Employee</h2>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="form-group">
            <label className='employeeAddLabel'>
              First Name:
              </label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="form-group">
          <label className='employeeAddLabel'>Middle Name:</label>
            <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
          </div>
          <div className="form-group">
          <label className='employeeAddLabel'>Last Name:</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="form-group">
        <label className='employeeAddLabel'>Username:</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="form-group">
        <label className='employeeAddLabel'>Position:</label>
          <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} />
        </div>
        <button className='addEmployeeButton' type="submit">Add Employee</button>
      </form>
      {successMessage && <p className="success-message">{successMessage}</p>}
    </div>
  );
};

export default EmployeeAddForm;
