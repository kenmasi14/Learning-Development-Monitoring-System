import React, { useState, useEffect } from 'react';
import TrainingForm from './TrainingForm';
import './EmployeeListView.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync } from '@fortawesome/free-solid-svg-icons';
import { css } from '@emotion/react';
import { ClipLoader } from 'react-spinners';
import axios from 'axios';

const override = css`
  display: block;
  margin: 0 auto;
  border-color: red;
`;

const EmployeeListView = () => {
  const [employeeList, setEmployeeList] = useState([]);
  const [isTrainingFormVisible, setTrainingFormVisible] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [refreshView, setRefreshView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchEmployeeData();
  }, [refreshView]);

  const handleDeleteEmployee = async (employeeId) => {
    try {
      const response = await axios.delete(`http://localhost:5000/employees/${employeeId}`);
      const data = response.data;

      if (data.success) {
        alert('Employee deleted successfully!');
        setRefreshView((prev) => !prev); // Trigger a refresh
      } else {
        alert('Error deleting employee');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const handleAddTraining = (employeeId) => {
    setSelectedEmployeeId(employeeId);
    setTrainingFormVisible(true);
  };

  const handleViewEmployee = (employeeId) => {
    window.open(`/view-employee-profile/${employeeId}`, '_blank');
  };

  const handleRefreshEmployeeList = () => {
    setRefreshView((prev) => !prev); // Trigger a refresh
    setIsLoading(true);
  };

  const fetchEmployeeData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/employees');
      setEmployeeList(response.data);
    } catch (error) {
      console.error('Error fetching employee data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="employee-list-container">
      <h2>Employee List</h2>

      <table className="modern-table">
        <thead>
          <tr>
            <th>Number</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Position</th>
            <th className='actionTable'>
              Actions
              <button className="refresh-button" onClick={handleRefreshEmployeeList}>
                {isLoading ? (
                  <ClipLoader color="#ffffff" loading={isLoading} css={override} size={15} />
                ) : (
                  <FontAwesomeIcon icon={faSync} />
                )}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {employeeList.map((employee, index) => (
            <tr key={employee.employee_id}>
              <td>{index + 1}</td>
              <td>{employee.first_name}</td>
              <td>{employee.last_name}</td>
              <td>{employee.position}</td>
              <td>
                <button className="delete-button" onClick={() => handleDeleteEmployee(employee.employee_id)}>
                  Delete
                </button>
                <button className="add-training-button" onClick={() => handleAddTraining(employee.employee_id)}>
                  Add Training
                </button>
                <button className="view-button" onClick={() => handleViewEmployee(employee.employee_id)}>
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {isTrainingFormVisible && (
        <TrainingForm onClose={() => setTrainingFormVisible(false)} employeeId={selectedEmployeeId} />
      )}
    </div>
  );
};

export default EmployeeListView;
