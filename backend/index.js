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

let db;

function handleDisconnect() {
  db = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 10000, // 10 seconds
    acquireTimeout: 10000, // 10 seconds
  });

  db.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      setTimeout(handleDisconnect, 2000);
    } else {
      console.log('Successfully connected to the database');
      connection.release();
    }
  });

  db.on('error', (err) => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

const queryAsync = util.promisify(db.query).bind(db);

app.options('*', cors());

// Multer storage configuration
const storage = multer.memoryStorage(); // Use memory storage for serverless environment

// Multer upload configuration
const upload = multer({ storage: storage });

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
  const filename = req.file ? req.file.buffer.toString('base64') : null; // Store image as base64 string

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
  const employeeId = req.params.employeeId;
  const { picture_filename } = req.body;

  const sql = 'UPDATE employee_profiles SET picture_filename = ? WHERE employee_id = ?';
  db.query(sql, [picture_filename, employeeId], (err, result) => {
    if (err) {
      console.error('Error updating employee profile:', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else {
      console.log('Employee profile updated successfully');
      res.json({ success: true, message: 'Employee profile updated successfully' });
    }
  });
});

app.put('/employees/updateProfile/:employeeId', (req, res) => {
  const employeeId = req.params.employeeId;
  const { birthday, office, religion, email, age, mobile_number } = req.body;

  const sql = `
    UPDATE employee_profiles 
    SET birthday = ?, office = ?, religion = ?, email = ?, age= ?, mobile_number = ?
    WHERE employee_id = ?
  `;

  db.query(sql, [birthday, office, religion, email, age, mobile_number, employeeId], (err, result) => {
    if (err) {
      console.error('Error updating employee profile:', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else {
      console.log('Employee profile updated successfully');
      res.json({ success: true, message: 'Employee profile updated successfully' });
    }
  });
});

// Route to retrieve employee profile in view-only mode
app.get('/viewEmployeeProfile/:employeeId', async (req, res) => {
  const employeeId = req.params.employeeId;

  try {
    const [employeeResults] = await queryAsync('SELECT * FROM employees WHERE employee_id = ?', [employeeId]);
    const [profileResults] = await queryAsync('SELECT username, picture_filename FROM employee_profiles WHERE employee_id = ?', [employeeId]);
    const [trainingResults] = await queryAsync('SELECT * FROM training WHERE employee_id = ?', [employeeId]);

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
  const imgCert = req.file ? req.file.buffer.toString('base64') : null;

  const sql =
    'INSERT INTO training (training_name, description, trainer_name, date_attended, date_completed, employee_id, imgCert) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(
    sql,
    [training_name, description, trainer_name, date_attended, date_completed, employee_id, imgCert],
    (err, result) => {
      if (err) {
        console.error('Error adding training record:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
      } else {
        res.json({ success: true, message: 'Training record added successfully' });
      }
    }
  );
});

// Fetch all employees route
app.get('/employees', (req, res) => {
  const sql = 'SELECT * FROM employees';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching employee data:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    } else {
      res.json(results);
    }
  });
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
    console.log('Employee Data:', profileResults);

    if (!profileResults) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const employeeDetails = {
      employee_id: profileResults.employee_id,
      first_name: profileResults.first_name,
      last_name: profileResults.last_name,
      middle_name: profileResults.middle_name,
      position: profileResults.position,
      username: profileResults.username,
      birthday: profileResults.birthday,
      office: profileResults.office,
      email: profileResults.email,
      age: profileResults.age,
      religion: profileResults.religion,
      mobile_number: profileResults.mobile_number,
      picture_filename: profileResults.picture_filename
    };

    res.json({ success: true, employeeDetails });
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

    const trainingDetails = results;
    console.log('Training Details:', trainingDetails);
    res.json({ success: true, trainingDetails });
  } catch (error) {
    console.error('Error fetching training details:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Fetch employee details and training records route
app.get('/employees/:employeeId', (req, res) => {
  const employeeId = req.params.employeeId;

  const sql = `
    SELECT employees.*, employee_profiles.*, training.* 
    FROM employees 
    LEFT JOIN employee_profiles ON employees.employee_id = employee_profiles.employee_id
    LEFT JOIN training ON employees.employee_id = training.employee_id
    WHERE employees.employee_id = ?
  `;

  db.query(sql, [employeeId], (err, results) => {
    if (err) {
      console.error('Error fetching employee details:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    } else {
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
    }
  });
});

// Delete employee route
app.delete('/employees/:employeeId', async (req, res) => {
  const employeeId = req.params.employeeId;

  try {
    const deleteEmployeeQuery = 'DELETE FROM employees WHERE employee_id = ?';
    const deleteTrainingQuery = 'DELETE FROM training WHERE employee_id = ?';

    await queryAsync(deleteEmployeeQuery, [employeeId]);
    await queryAsync(deleteTrainingQuery, [employeeId]);

    res.json({ success: true, message: 'Employee and associated training records deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.listen(5000, console.logo("server is running na po"));

// Export the Express API
module.exports = app;