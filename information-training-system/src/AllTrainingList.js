import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AllTrainingList.css';

const AllTrainingList = () => {
  const [trainingList, setTrainingList] = useState([]);
  const [filteredTrainingList, setFilteredTrainingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalImage, setModalImage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch all training records
    axios.get('https://learning-development-monitoring-system-server.vercel.app/training/all')
      .then(response => {
        setTrainingList(response.data.trainingDetails);
        setFilteredTrainingList(response.data.trainingDetails);
        setLoading(false);
      })
      .catch(error => {
        setError('Failed to fetch training records');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Filter training list based on search term
    const filtered = trainingList.filter(training => {
      const fullName = `${training.first_name} ${training.middle_name ? training.middle_name + ' ' : ''}${training.last_name}`;
      return (
        training.training_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        training.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        training.trainer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(training.date_attended).toLocaleDateString().includes(searchTerm.toLowerCase()) ||
        new Date(training.date_completed).toLocaleDateString().includes(searchTerm.toLowerCase()) ||
        fullName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredTrainingList(filtered);
  }, [searchTerm, trainingList]);

  const handleViewCertificate = (image) => {
    console.log('Setting modal image:', image);
    setModalImage(image);
    setShowModal(true);
  };

  const handlePrintCertificate = (image) => {
    if (image) {
      const imageUrl = `https://raw.githubusercontent.com/kenmasi14/Learning-Development-Monitoring-System/main/backend/assets/employee-images/${image}`;
      console.log('Preparing to print certificate...');
      console.log('Image URL:', imageUrl);

      const printWindow = window.open('', '', 'height=600,width=800');
      if (!printWindow) {
        console.error('Failed to open print window');
        return;
      }

      printWindow.document.open();
      printWindow.document.write(`
        <html>
        <head>
          <title>Print Certificate</title>
          <style>
            img { max-width: 100%; height: auto; }
            body { margin: 0; padding: 0; }
          </style>
        </head>
        <body>
          <img src="${imageUrl}" alt="Certificate Image" onload="window.print();window.close()" />
        </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      console.warn('No certificate image available for printing');
    }
  };

  const handlePrint = () => {
    const printContent = searchTerm ? filteredTrainingList : trainingList;
    const printWindow = window.open('', '', 'height=600,width=800');
    
    if (!printWindow) {
      console.error('Failed to open print window');
      return;
    }

    const tableRows = printContent.map(training => `
      <tr>
        <td>${training.training_name}</td>
        <td>${training.description}</td>
        <td>${training.trainer_name}</td>
        <td>${new Date(training.date_attended).toLocaleDateString()}</td>
        <td>${new Date(training.date_completed).toLocaleDateString()}</td>
        <td>${`${training.first_name} ${training.middle_name ? training.middle_name + ' ' : ''}${training.last_name}`}</td>
      </tr>
    `).join('');

    printWindow.document.open();
    printWindow.document.write(`
      <html>
      <head>
        <title>Print Training Records</title>
        <style>
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #f4f4f4; }
        </style>
      </head>
      <body>
        <h1>Training Records</h1>
        <table>
          <thead>
            <tr>
              <th>Training Name</th>
              <th>Description</th>
              <th>Trainer Name</th>
              <th>Date Attended</th>
              <th>Date Completed</th>
              <th>Employee Name</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
            window.close();
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalImage(null);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="training-list">
      <h2>All Training Records 
        <button onClick={() => window.location.reload()} className="refresh-button">Refresh</button>
      </h2>
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="search-input"
      />
      <button onClick={handlePrint} className="print-button">Print Records</button>
      <table>
        <thead>
          <tr>
            <th>Training Name</th>
            <th>Description</th>
            <th>Trainer Name</th>
            <th>Date Attended</th>
            <th>Date Completed</th>
            <th>Employee Name</th>
            <th>Certificate</th>
          </tr>
        </thead>
        <tbody>
          {filteredTrainingList.map((training, index) => (
            <tr key={index}>
              <td>{training.training_name.length > 30 ? `${training.training_name.substring(0, 30)}...` : training.training_name}</td>
              <td>{training.description.length > 50 ? `${training.description.substring(0, 50)}...` : training.description}</td>
              <td>{training.trainer_name.length > 30 ? `${training.trainer_name.substring(0, 30)}...` : training.trainer_name}</td>
              <td>{new Date(training.date_attended).toLocaleDateString()}</td>
              <td>{new Date(training.date_completed).toLocaleDateString()}</td>
              <td>{`${training.first_name} ${training.middle_name ? training.middle_name + ' ' : ''}${training.last_name}`}</td>
              <td>
                {training.imgCert ? (
                  <>
                    <button className="view-certificate-btn" onClick={() => handleViewCertificate(training.imgCert)}>View Certificate</button>
                    <button className="print-certificate-btn" onClick={() => handlePrintCertificate(training.imgCert)}>Print Certificate</button>
                  </>
                ) : (
                  <span className="no-certificate">No Certificate Available</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && modalImage && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content">
            <button className="modal-close" onClick={handleCloseModal}>X</button>
            <img src={`https://raw.githubusercontent.com/kenmasi14/Learning-Development-Monitoring-System/main/backend/assets/employee-images/${modalImage}`} alt="Certificate" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllTrainingList;
