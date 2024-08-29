const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const util = require('util');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Database connection
const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Promisify for async/await use
const queryAsync = util.promisify(db.query).bind(db);

app.options('*', cors());

// Multer storage configuration
const storage = multer.memoryStorage(); // Use memory storage for serverless environment

// Multer upload configuration
const upload = multer({ storage: storage });

// Routes

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

// Handle image upload (modified for serverless)
app.post('/updateEmployeeProfile/:employeeId', upload.single('image'), async (req, res) => {
  const employeeId = req.params.employeeId;
  const filename = req.file ? req.file.originalname : null;

  try {
    // In a serverless environment, you'd typically upload to cloud storage here
    // For this example, we'll just update the filename in the database
    await queryAsync('UPDATE employee_profiles SET picture_filename = ? WHERE employee_id = ?', [filename, employeeId]);
    res.json({ success: true, message: 'Employee profile updated successfully' });
  } catch (error) {
    console.error('Error updating employee profile:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Update employee profile
app.put('/updateEmployeeProfile/:employeeId', async (req, res) => {
  const employeeId = req.params.employeeId;
  const { picture_filename } = req.body;

  try {
    await queryAsync('UPDATE employee_profiles SET picture_filename = ? WHERE employee_id = ?', [picture_filename, employeeId]);
    res.json({ success: true, message: 'Employee profile updated successfully' });
  } catch (error) {
    console.error('Error updating employee profile:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

app.put('/employees/updateProfile/:employeeId', async (req, res) => {
  const employeeId = req.params.employeeId;
  const { birthday, office, religion, email, age, mobile_number } = req.body;

  try {
    await queryAsync(
      'UPDATE employee_profiles SET birthday = ?, office = ?, religion = ?, email = ?, age = ?, mobile_number = ? WHERE employee_id = ?',
      [birthday, office, religion, email, age, mobile_number, employeeId]
    );
    res.json({ success: true, message: 'Employee profile updated successfully' });
  } catch (error) {
    console.error('Error updating employee profile:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Route to retrieve employee profile in view-only mode
app.get('/viewEmployeeProfile/:employeeId', async (req, res) => {
  const employeeId = req.params.employeeId;

  try {
    const [employeeResults] = await queryAsync('SELECT * FROM employees WHERE employee_id = ?', [employeeId]);
    const [profileResults] = await queryAsync('SELECT username, picture_filename FROM employee_profiles WHERE employee_id = ?', [employeeId]);
    const trainingResults = await queryAsync('SELECT * FROM training WHERE employee_id = ?', [employeeId]);

    if (!employeeResults) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const employeeDetails = {
      ...employeeResults,
      username: profileResults?.username || null,
      picture_filename: profileResults?.picture_filename || null,
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
    const employeeResult = await queryAsync(
      'INSERT INTO employees (first_name, last_name, middle_name, position) VALUES (?, ?, ?, ?)',
      [firstName, lastName, middleName, position]
    );

    const employeeId = employeeResult.insertId;
    const username = profile.username;
    const defaultPassword = 'admin12345';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await queryAsync(
      'INSERT INTO employee_profiles (employee_id, username, password) VALUES (?, ?, ?)',
      [employeeId, username, hashedPassword]
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Add training route
app.post('/training/add', upload.single('imgCert'), async (req, res) => {
  const { training_name, description, trainer_name, date_attended, date_completed, employee_id } = req.body;
  const imgCert = req.file ? req.file.originalname : null;

  try {
    await queryAsync(
      'INSERT INTO training (training_name, description, trainer_name, date_attended, date_completed, employee_id, imgCert) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [training_name, description, trainer_name, date_attended, date_completed, employee_id, imgCert]
    );
    res.json({ success: true, message: 'Training record added successfully' });
  } catch (error) {
    console.error('Error adding training record:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Fetch all employees route
app.get('/employees', async (req, res) => {
  try {
    const results = await queryAsync('SELECT * FROM employees');
    res.json(results);
  } catch (error) {
    console.error('Error fetching employee data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Login route
app.post('/employees/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await queryAsync('SELECT * FROM employee_profiles WHERE username = ?', [username]);

    if (result.length > 0) {
      const hashedPassword = result[0].password;
      const isPasswordValid = await bcrypt.compare(password, hashedPassword);

      if (isPasswordValid) {
        const employeeId = result[0].employee_id;
        res.json({ success: true, employeeId });
      } else {
        res.json({ success: false, message: 'Invalid credentials' });
      }
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Employee Detail Page route
app.get('/employeeDetailPage/:employeeId', async (req, res) => {
  const employeeId = req.params.employeeId;

  try {
    const [profileResults] = await queryAsync(
      `SELECT 
         e.employee_id,
         e.first_name,
         e.last_name,
         e.middle_name,
         e.position,
         ep.username,
         ep.birthday,
         ep.office,
         ep.email,
         ep.age,
         ep.religion,
         ep.mobile_number,
         ep.picture_filename
       FROM employees e
       JOIN employee_profiles ep ON e.employee_id = ep.employee_id
       WHERE e.employee_id = ?`,
      [employeeId]
    );

    if (!profileResults) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    res.json({ success: true, employeeDetails: profileResults });
  } catch (error) {
    console.error('Error fetching employee details:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

app.get('/employees/:employeeId/training', async (req, res) => {
  const employeeId = req.params.employeeId;

  try {
    const results = await queryAsync('SELECT * FROM training WHERE employee_id = ?', [employeeId]);

    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, error: 'No training records found' });
    }

    res.json({ success: true, trainingDetails: results });
  } catch (error) {
    console.error('Error fetching training details:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Fetch employee details and training records route
app.get('/employees/:employeeId', async (req, res) => {
  const employeeId = req.params.employeeId;

  try {
    const results = await queryAsync(`
      SELECT employees.*, employee_profiles.*, training.* 
      FROM employees 
      LEFT JOIN employee_profiles ON employees.employee_id = employee_profiles.employee_id
      LEFT JOIN training ON employees.employee_id = training.employee_id
      WHERE employees.employee_id = ?
    `, [employeeId]);

    if (results.length === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const employee = results[0];
    const training = results.map(row => ({
      training_id: row.training_id,
      training_name: row.training_name,
      description: row.description,
      date_attended: row.date_attended,
      date_completed: row.date_completed,
      trainer_name: row.trainer_name
    }));

    res.json({ success: true, employee, training });
  } catch (error) {
    console.error('Error fetching employee details:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete employee route
app.delete('/employees/:employeeId', async (req, res) => {
  const employeeId = req.params.employeeId;

  try {
    await queryAsync('DELETE FROM employees WHERE employee_id = ?', [employeeId]);
    await queryAsync('DELETE FROM training WHERE employee_id = ?', [employeeId]);

    res.json({ success: true, message: 'Employee and associated training records deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Export the Express API
module.exports = app;