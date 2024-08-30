import React, { useState } from 'react';
import './TrainingForm.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TrainingForm = ({ onClose, employeeId }) => {
  const [trainingData, setTrainingData] = useState({
    training_name: '',
    description: '',
    trainer_name: '',
    date_attended: '',
    date_completed: '',
    imgCert: null,
    employee_id: employeeId,
  });

  const handleFileChange = (e) => {
    setTrainingData({ ...trainingData, imgCert: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('training_name', trainingData.training_name);
    formData.append('description', trainingData.description);
    formData.append('trainer_name', trainingData.trainer_name);
    formData.append('date_attended', trainingData.date_attended);
    formData.append('date_completed', trainingData.date_completed);
    formData.append('imgCert', trainingData.imgCert);
    formData.append('employee_id', trainingData.employee_id);

    try {
      const response = await fetch('https://learning-development-monitoring-system-server.vercel.app/training/add', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Training record added successfully!', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
        });
        onClose();
      } else {
        toast.error(`Error adding training record: ${data.message}`, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
        });
      }
    } catch (error) {
      toast.error(`Error adding training record: ${error.message}`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
      });
    }
  };

  return (
    <div>
      <div className="overlay" onClick={onClose}></div>
      <div className="training-form-modal">
        <h2>Add Training Record</h2>
        <form onSubmit={handleSubmit}>
          <label className='trainingFormLabel'>
            Training Name:
            <input
              type="text"
              value={trainingData.training_name}
              onChange={(e) =>
                setTrainingData({ ...trainingData, training_name: e.target.value })
              }
            />
          </label>
          <br />
          <label className='trainingFormLabel'>
            Description:
            <select
              value={trainingData.description}
              onChange={(e) =>
                setTrainingData({ ...trainingData, description: e.target.value })
              }
            >
              <option value="">Select Description</option>
              <option value="Completed">Completed</option>
              <option value="Participation">Participation</option>
            </select>
          </label>
          <br />
          <label className='trainingFormLabel'>
            Trainer Name:
            <input
              type="text"
              value={trainingData.trainer_name}
              onChange={(e) =>
                setTrainingData({ ...trainingData, trainer_name: e.target.value })
              }
            />
          </label>
          <br />
          <label className='trainingFormLabel'>
            Date Attended:
            <input
              type="date"
              value={trainingData.date_attended}
              onChange={(e) =>
                setTrainingData({ ...trainingData, date_attended: e.target.value })
              }
            />
          </label>
          <br />
          <label className='trainingFormLabel'>
            Date Completed:
            <input
              type="date"
              value={trainingData.date_completed}
              onChange={(e) =>
                setTrainingData({ ...trainingData, date_completed: e.target.value })
              }
            />
          </label>
          <br />
          <label className='trainingFormLabel'>
            Certificate Image:
            <input type="file" onChange={handleFileChange} />
          </label>
          <br />
          <label className='trainingFormLabel'>
            Employee ID:
            <input
              type="text"
              value={trainingData.employee_id}
              onChange={(e) =>
                setTrainingData({ ...trainingData, employee_id: e.target.value })
              }
              disabled
            />
          </label>
          <br />
          <button type="submit" className="btnSubmit">Add Training</button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default TrainingForm;
