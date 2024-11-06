require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const util = require('util');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Multer storage configuration (using memory storage for temporary upload)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Database connection handling with reconnect logic
let db;
function handleDisconnect() {
  db = mysql.createConnection({
    host: process.env.DB_HOST, // Use environment variable
    user: process.env.DB_USER, // Use environment variable
    password: process.env.DB_PASSWORD, // Use environment variable
    database: process.env.DB_NAME, // Use environment variable
  });

  db.connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      setTimeout(handleDisconnect, 2000);
    } else {
      console.log('Successfully connected to the database');
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

// Sample route to fetch all training records
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

    res.json({ success: true, trainingDetails: results });
  } catch (error) {
    console.error('Error fetching training records:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Upload employee profile picture
app.post('/updateEmployeeProfile/:employeeId', upload.single('image'), async (req, res) => {
  const employeeId = req.params.employeeId;
  const filename = req.file ? req.file.buffer.toString('base64') : null;

  if (!filename) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }

  try {
    await queryAsync('UPDATE employee_profiles SET picture_filename = ? WHERE employee_id = ?', [filename, employeeId]);
    res.json({ success: true, message: 'Employee profile updated successfully' });
  } catch (error) {
    console.error('Error updating employee profile:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Route for admin login
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
