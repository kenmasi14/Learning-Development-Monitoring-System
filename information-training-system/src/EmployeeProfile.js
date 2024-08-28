import React from 'react';

const EmployeeProfile = ({ firstName }) => {
  return (
    <div className="employee-profile-container">
      <h2>Welcome, {firstName}!</h2>
      <p>Hello, {firstName}! This is your profile page.</p>
    </div>
  );
};

export default EmployeeProfile;
