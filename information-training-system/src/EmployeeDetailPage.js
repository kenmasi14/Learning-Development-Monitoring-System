import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaCamera } from 'react-icons/fa';
import EmployeeModalEdit from './EmployeeModalEdit'; // Import the EmployeeModalEdit component
import './EmployeeDetailPage.css';

const EmployeeDetailPage = () => {
  const { employeeId } = useParams();
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [trainingDetails, setTrainingDetails] = useState([]);
  const [filteredTrainingDetails, setFilteredTrainingDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [fileName, setFileName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchEmployeeAndTrainingDetails = async () => {
    try {
      setLoading(true);

      if (!employeeId) {
        console.error('No employee ID provided');
        setLoading(false);
        return;
      }

      // Fetch employee details
      const employeeResponse = await fetch(`https://learning-development-monitoring-system-server.vercel.app/employeeDetailPage/${employeeId}`);
      const employeeData = await employeeResponse.json();
      console.log('Employee Data:', employeeData); // Log the employee data

      if (employeeData.success) {
        setEmployeeDetails(employeeData.employeeDetails);

        if (employeeData.employeeDetails.picture_filename) {
          setAvatar(`https://raw.githubusercontent.com/kenmasi14/Learning-Development-Monitoring-System/main/backend/assets/employee-images/${employeeData.employeeDetails.picture_filename}`);
        }

        // Fetch training details
        const trainingResponse = await fetch(`https://learning-development-monitoring-system-server.vercel.app/employees/${employeeId}/training`);
        const trainingData = await trainingResponse.json();
        console.log('Training Data:', trainingData); // Log the training data

        if (trainingData.success) {
          setTrainingDetails(trainingData.trainingDetails);
          setFilteredTrainingDetails(trainingData.trainingDetails);
        } else {
          console.error('Error fetching training details:', trainingData.error);
          setTrainingDetails([]);
        }
      } else {
        console.error('Error fetching employee details:', employeeData.error);
        setEmployeeDetails(null);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching details:', error);
      setLoading(false);
      setEmployeeDetails(null);
      setTrainingDetails([]);
    }
  };

  useEffect(() => {
    fetchEmployeeAndTrainingDetails();
  }, [employeeId]);

  const handleSearch = (event) => {
    const searchValue = event.target.value.toLowerCase();
    setSearchTerm(searchValue);
    const filteredData = trainingDetails.filter(training =>
      training.training_name.toLowerCase().includes(searchValue) ||
      training.trainer_name.toLowerCase().includes(searchValue) ||
      training.description.toLowerCase().includes(searchValue)
    );
    setFilteredTrainingDetails(filteredData);
  };

  const renderCertificateImage = (imgCert) => {
    return (
      <div className="certificate-image-container">
        {imgCert ? (
          <img src={`https://raw.githubusercontent.com/kenmasi14/Learning-Development-Monitoring-System/main/backend/assets/employee-images/${imgCert}`} alt="Certificate" className="certificate-image" />
        ) : (
          <div className="no-certificate">No Certificate Available</div>
        )}
      </div>
    );
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    setFileName(file.name);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`https://learning-development-monitoring-system-server.vercel.app/updateEmployeeProfile/${employeeId}`, {
        method: 'POST',
        body: formData,
      });
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        if (data.success) {
          setAvatar(URL.createObjectURL(file));
          setUploadSuccess(true);
        } else {
          console.error('Image upload failed:', data.error);
        }
      } else {
        throw new Error('Server response is not in JSON format');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleCloseModal = () => {
    setUploadSuccess(false);
    setShowModal(false);
  };

  const handleUpdateProfile = async (updatedProfile) => {
    try {
      updatedProfile.employeeId = employeeId;

      const response = await fetch(`https://learning-development-monitoring-system-server.vercel.app/employees/updateProfile/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedProfile),
      });
      const data = await response.json();
      if (data.success) {
        fetchEmployeeAndTrainingDetails();
        setShowModal(false);
      } else {
        console.error('Error updating employee profile:', data.error);
      }
    } catch (error) {
      console.error('Error updating employee profile:', error);
    }
  };

  const formattedBirthday = employeeDetails ?
    new Date(employeeDetails.birthday).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }) :
    '';

  return (
    <div className="profile-page">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="top-section">
            <div className="profile-header">
              <div className="avatar-section">
                <label htmlFor="upload-input">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Avatar"
                      className="avatar-image"
                    />
                  ) : (
                    <span className="avatar-placeholder">+</span>
                  )}
                </label>
                <input
                  type="file"
                  id="upload-input"
                  className="upload-input"
                  onChange={handleUpload}
                  accept="image/*"
                />
                <FaCamera onClick={() => document.getElementById('upload-input').click()} className="camera-icon" />
              </div>

              {employeeDetails ? (
                <div className="profile-details">
                  <h3>Basic Information</h3>
                  <div className="containerInfo">
                    <p><strong>Name:</strong> {employeeDetails.first_name} {employeeDetails.last_name}</p>
                    <p><strong>Birthday:</strong> {formattedBirthday}</p>
                    <p><strong>Position:</strong> {employeeDetails.position}</p>
                    <p><strong>Email:</strong> {employeeDetails.email}</p>
                    <p><strong>Mobile Number:</strong> {employeeDetails.mobile_number}</p>
                  </div>
                </div>
              ) : (
                <p>Employee details not available.</p>
              )}
            </div>
          </div>

          {trainingDetails.length > 0 && (
            <div className="training-section">
              <div className="filter-search">
                <h3>Training Details</h3>
                <input
                  type="text"
                  placeholder="Search training..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="search-input modern-input"
                />
              </div>

              <div className="training-cards">
                {filteredTrainingDetails.map((training) => (
                  <div key={training.training_id} className="training-card">
                    {renderCertificateImage(training.imgCert)}
                    <div className="training-card-content">
                      <p><strong>Training Name:</strong> {training.training_name}</p>
                      <p><strong>Status:</strong> {training.description}</p>
                      <p><strong>Trainer:</strong> {training.trainer_name}</p>
                      <p><strong>Date Attended:</strong> {new Date(training.date_attended).toLocaleDateString()}</p>
                      <p><strong>Date Completed:</strong> {new Date(training.date_completed).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeeDetailPage;
