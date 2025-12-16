const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// PostgreSQL Database Connection
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres-service',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  database: process.env.DB_NAME || 'studentdb'
});

// Test Database Connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.stack);
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

// Initialize Database Table
const initDB = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      roll_number VARCHAR(50) UNIQUE NOT NULL,
      department VARCHAR(100) NOT NULL,
      semester INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  try {
    await pool.query(createTableQuery);
    console.log('✅ Students table initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

initDB();

// Routes

// Health Check (for Kubernetes liveness probe)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Student Management System'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Student Management System API',
    project: 'CSC418 DevOps CI/CD Pipeline',
    university: 'COMSATS University Islamabad',
    endpoints: {
      health: 'GET /health',
      students: 'GET /api/students',
      addStudent: 'POST /api/students',
      getStudent: 'GET /api/students/:id',
      deleteStudent: 'DELETE /api/students/:id'
    }
  });
});

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students ORDER BY id DESC');
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch students' 
    });
  }
});

// Get single student
app.get('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM students WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch student' 
    });
  }
});

// Add new student
app.post('/api/students', async (req, res) => {
  try {
    const { name, roll_number, department, semester } = req.body;
    
    // Validation
    if (!name || !roll_number || !department || !semester) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }
    
    const result = await pool.query(
      'INSERT INTO students (name, roll_number, department, semester) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, roll_number, department, semester]
    );
    
    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding student:', error);
    
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ 
        success: false, 
        error: 'Roll number already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add student' 
    });
  }
});

// Delete student
app.delete('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Student deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete student' 
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Student Management System - CSC418 DevOps Project`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('Database pool closed');
  });
});
