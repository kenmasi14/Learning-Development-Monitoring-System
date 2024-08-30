import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './ViewEmployeeProfile.css';

const ViewEmployeeProfile = () => {
    const { employeeId } = useParams();
    const [employeeDetails, setEmployeeDetails] = useState(null);
    const [trainingDetails, setTrainingDetails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [avatar, setAvatar] = useState(null);

    const fetchEmployeeAndTrainingDetails = async () => {
        try {
            setLoading(true);

            if (!employeeId) {
                setLoading(false);
                return;
            }

            const employeeResponse = await fetch(`http://https://pdrrmo-oksi-ldms.vercel.app/employeeDetailPage/${employeeId}`);
            const employeeData = await employeeResponse.json();

            if (employeeData.success) {
                setEmployeeDetails(employeeData.employeeDetails);

                if (employeeData.employeeDetails.picture_filename) {
                    setAvatar(`https://pdrrmo-oksi-ldms.vercel.app/assets/employee-images/${employeeData.employeeDetails.picture_filename}`);
                }

                const trainingResponse = await fetch(`https://pdrrmo-oksi-ldms.vercel.app/employees/${employeeId}/training`);
                const trainingData = await trainingResponse.json();

                if (trainingData.success) {
                    setTrainingDetails(trainingData.trainingDetails);
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

    const formattedBirthday = employeeDetails
        ? new Date(employeeDetails.birthday).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })
        : '';

    return (
        <div className="view-profile-page">
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="view-profile-container">
                    <div className="view-avatar-section">
                        {avatar ? (
                            <img src={avatar} alt="Avatar" className="view-avatar-image" />
                        ) : (
                            <span className="view-avatar-placeholder">No Image Available</span>
                        )}
                    </div>

                    {employeeDetails && (
                        <div className="view-profile-details">
                            <h3>Basic Information</h3>
                            <div className="view-profile-info">
                                <p><strong>Name:</strong> {employeeDetails.first_name} {employeeDetails.last_name}</p>
                                <p><strong>Birthday:</strong> {formattedBirthday}</p>
                                <p><strong>Position:</strong> {employeeDetails.position}</p>
                                <p><strong>Email:</strong> {employeeDetails.email}</p>
                                <p><strong>Mobile Number:</strong> {employeeDetails.mobile_number}</p>
                            </div>

                            {trainingDetails.length > 0 && (
                                <div className="view-training-section">
                                    <h3>Training Details</h3>
                                    <ul className="view-training-list">
                                        {trainingDetails.map((training) => (
                                            <li key={training.training_id}>
                                                <p><strong>Training Name:</strong> {training.training_name}</p>
                                                <p><strong>Status:</strong> {training.description}</p>
                                                <p><strong>Trainer:</strong> {training.trainer_name}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ViewEmployeeProfile;
