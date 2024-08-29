const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const util = require('util');
const multer = require('multer'); 
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST, // Database host
  user: process.env.DB_USER, // Database user
  password: process.env.DB_PASSWORD, // Database password
  database: process.env.DB_NAME // Database name
});

module.exports = db;

// Use util.promisify to convert callback-style queries to promises
const queryAsync = util.promisify(db.query).bind(db);

app.options('*', cors());

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'assets/employee-images'); // Destination folder for saving uploaded images
  },
  filename: function (req, file, cb) {
    // Set filename as current date/time + original file extension
    cb(null, Date.now() + '-' + file.originalname);
  },
});

// Multer upload configuration
const upload = multer({ storage: storage });

app.use('/assets/employee-images', express.static(path.join(__dirname, 'assets/employee-images')));

// New Route: Fetch all training records with duplicate names included
app.get('/training/all', async (req, res) => {
  try {
    const results = await queryAsync(`
      SELECT 
        t.training_name,
        t.description,
        t.trainer_name,
        t.date_attended,
        t.date_completed,
        e.first_name,
        e.last_name,
        e.middle_name,
        t.imgCert
      FROM training t
      JOIN employees e ON t.employee_id = e.employee_id
    `);

    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, error: 'No training records found' });
    }

    res.json({ success: true, trainingDetails: results });
  } catch (error) {
    console.error('Error fetching training records:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Handle image upload
app.post('/updateEmployeeProfile/:employeeId', upload.single('image'), (req, res) => {
  const employeeId = req.params.employeeId;
  const filename = req.file ? req.file.filename : null; // Uploaded file name or null if no file uploaded

  // SQL query to update the employee profile with the new picture filename
  const sql = 'UPDATE employee_profiles SET picture_filename = ? WHERE employee_id = ?';
  db.query(sql, [filename, employeeId], (err, result) => {
    if (err) {
      console.error('Error updating employee profile:', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else {
      res.json({ success: true, message: 'Employee profile updated successfully' });
    }
  });
});

// Update employee profile
app.put('/updateEmployeeProfile/:employeeId', (req, res) => {
  // Extract employeeId from the request parameters
  const employeeId = req.params.employeeId;
  // Extract picture_filename from the request body
  const { picture_filename } = req.body;

  // SQL query to update the employee profile with the new picture filename
  const sql = 'UPDATE employee_profiles SET picture_filename = ? WHERE employee_id = ?';
  // Execute the SQL query with the provided parameters
  db.query(sql, [picture_filename, employeeId], (err, result) => {
    if (err) {
      // If an error occurs during the database operation, log the error and send a 500 response
      console.error('Error updating employee profile:', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else {
      // If the update is successful, log a success message and send a JSON response
      console.log('Employee profile updated successfully');
      res.json({ success: true, message: 'Employee profile updated successfully' });
    }
  });
});

app.put('/employees/updateProfile/:employeeId', (req, res) => {
  const employeeId = req.params.employeeId;
  const { birthday, office,religion,email, age, mobile_number } = req.body;

  // SQL query to update the employee profile with the new details
  const sql = `
    UPDATE employee_profiles 
    SET birthday = ?, office = ?, religion = ?, email = ?, age= ?, mobile_number = ?
    WHERE employee_id = ?
  `;
  
  // Execute the SQL query with the provided parameters
  db.query(sql, [birthday, office, religion, email, age, mobile_number, employeeId], (err, result) => {
    if (err) {
      // If an error occurs during the database operation, log the error and send a 500 response
      console.error('Error updating employee profile:', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else {
      // If the update is successful, log a success message and send a JSON response
      console.log('Employee profile updated successfully');
      res.json({ success: true, message: 'Employee profile updated successfully' });
    }
  });
});

// Route to retrieve employee profile in view-only mode
app.get('/viewEmployeeProfile/:employeeId', async (req, res) => {
  const employeeId = req.params.employeeId;

  try {
    const [employeeResults] = await db.query('SELECT * FROM employees WHERE employee_id = ?', [employeeId]);
    const [profileResults] = await db.query('SELECT username, picture_filename FROM employee_profiles WHERE employee_id = ?', [employeeId]);
    const [trainingResults] = await db.query('SELECT * FROM training WHERE employee_id = ?', [employeeId]);

    if (employeeResults.length === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const employeeDetails = {
      ...employeeResults[0],
      username: profileResults[0]?.username || null,
      picture_filename: profileResults[0]?.picture_filename || null,
    };

    res.json({
      success: true,
      employeeDetails,
      trainingDetails: trainingResults
    });
  } catch (error) {
    console.error('Error fetching employee details:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Admin login route
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid username and password' });
  }
});

// Add employee route
app.post('/employees/add', async (req, res) => {
  const { firstName, lastName, middleName, position, profile } = req.body;

  try {
    const employeeInsertQuery =
      'INSERT INTO employees (first_name, last_name, middle_name, position) VALUES (?, ?, ?, ?)';
    const employeeResult = await queryAsync(employeeInsertQuery, [
      firstName,
      lastName,
      middleName,
      position,
    ]);

    const employeeId = employeeResult.insertId;

    const username = profile.username;
    const defaultPassword = 'admin12345';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const profileInsertQuery =
      'INSERT INTO employee_profiles (employee_id, username, password) VALUES (?, ?, ?)';
    await queryAsync(profileInsertQuery, [employeeId, username, hashedPassword]);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Add training route
app.post('/training/add', upload.single('imgCert'), (req, res) => {
  const { training_name, description, trainer_name, date_attended, date_completed, employee_id } = req.body;
  const imgCert = req.file ? req.file.filename : null;

  const sql =
    'INSERT INTO training (training_name, description, trainer_name, date_attended, date_completed, employee_id, imgCert) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(
    sql,
    [training_name, description, trainer_name, date_attended, date_completed, employee_id, imgCert],
    (err, result) => {
      if (err) {
        console.error('Error adding training record:', err);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
      } else {
        res.json({ success: true, message: 'Training record added successfully' });
      }
    }
  );
});

// Default route
app.get('/', (req, res) => {
  res.send('API is working!');
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unexpected Error:', err);
  res.status(500).json({ success: false, error: 'Something went wrong!' });
});
