import React, { useState, useEffect } from 'react';
import './EmployeeModalEdit.css';

const EmployeeModalEdit = ({ onClose, onUpdateProfile, employeeId, fetchEmployeeData }) => {
  const [updatedProfile, setUpdatedProfile] = useState({
    birthday: '',
    office: '',
    religion: '',
    email: '',
    age: '',
    mobile_number: ''
  });

  useEffect(() => {
    const getEmployeeData = async () => {
      const data = await fetchEmployeeData(employeeId);
      if (data && data.success) {
        // Convert birthday to yyyy-MM-dd format
        const formattedBirthday = data.employee.birthday 
          ? new Date(data.employee.birthday).toISOString().split('T')[0] 
          : '';

        setUpdatedProfile({
          birthday: formattedBirthday,
          office: data.employee.office || '',
          religion: data.employee.religion || '',
          email: data.employee.email || '',
          age: data.employee.age || '',
          mobile_number: data.employee.mobile_number || ''
        });
      }
    };

    if (employeeId) {
      getEmployeeData();
    }
  }, [employeeId, fetchEmployeeData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedProfile(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateProfile(updatedProfile);
  };

  return (
    <div className="modal">
      <div className="modal-data">
        <span className="close" onClick={onClose}>&times;</span>
        <div className='container-fluid headerUpdate'>
          <h2>Update Profile</h2>
        </div>
        <form className='formData' onSubmit={handleSubmit}>
          <div className='formNewEdit'>
            <label className='birthdayEdit' htmlFor="birthday">Birthday:</label>
            <input 
              type="date" 
              id="birthday" 
              name="birthday" 
              value={updatedProfile.birthday} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className='formNewEdit'>
            <label className='officeEdit' htmlFor="office">Office:</label>
            <input 
              type="text" 
              id="office" 
              name="office" 
              value={updatedProfile.office} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className='formNewEdit'>
            <label className='religionUpdate' htmlFor="religion">Religion:</label>
            <input 
              type="text" 
              id="religion" 
              name="religion" 
              value={updatedProfile.religion} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className='formNewEdit'>
            <label className='religionUpdate' htmlFor="email">Email:</label>
            <input 
              type="text" 
              id="email" 
              name="email" 
              value={updatedProfile.email} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className='formNewEdit'>
            <label className='religionUpdate' htmlFor="age">Age:</label>
            <input 
              type="number" 
              id="age" 
              name="age" 
              value={updatedProfile.age} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className='formNewEdit'>
            <label className='mobileUpdate' htmlFor="mobile_number">Mobile Number:</label>
            <input 
              type="text" 
              id="mobile_number" 
              name="mobile_number" 
              value={updatedProfile.mobile_number} 
              onChange={handleChange} 
              required 
            />
          </div>
          <button className='submitUpdateProfile' type="submit">Update</button>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModalEdit;
