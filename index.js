import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg'; // Import pg as a package
const { Pool } = pkg; // Destructure Pool from the imported package

dotenv.config(); // Load environment variables from .env file

const app = express();
app.use(cors());
app.use(express.json());

// Initialize the PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://your-database-url"
});

// Verify connection to the database on server start
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err.stack);
    process.exit(1); // Exit if there is a connection error
  } else {
    console.log('Database connected successfully');
    release();
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.post('/api/consumers', async (req, res) => {
  const {
    relationship_to_user,
    consumers_age,
    consumers_password,
    consumers_name,
    consumers_email
  } = req.body;

  // Ensure all fields are provided
  if (!relationship_to_user || !consumers_age || !consumers_password || !consumers_name || !consumers_email) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const query = `
    INSERT INTO consumers (relationship_to_user, consumers_age, consumers_password, consumers_name, consumers_email)
    VALUES ($1, $2, $3, $4, $5) RETURNING *
  `;
  const values = [relationship_to_user, consumers_age, consumers_password, consumers_name, consumers_email];

  try {
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]); // Return the newly added consumer
  } catch (err) {
    console.error('Database insert error:', err.stack);
    res.status(500).json({ error: 'Database insert error', details: err.message });
  }
});

// Get all consumers (GET)
app.get('/api/consumers', async (req, res) => {
  const query = `
    SELECT relationship_to_user, consumers_age, consumers_password, consumers_name, consumers_email
    FROM consumers
  `;

  try {
    const result = await pool.query(query);
    res.status(200).json(result.rows); // Return all consumers
  } catch (err) {
    console.error('Database fetch error:', err.stack);
    res.status(500).json({ error: 'Database fetch error', details: err.message });
  }
});


app.post('/api/tasks', async (req, res) => {
  const { task_title, task_description, main_topic, reminder } = req.body;
  const image = "https://picsum.photos/200/300";
  const status = "pending";

  const query = `
    INSERT INTO consumertasks (task_title, task_description, main_topic, image, status, reminder)
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
  `;
  const values = [task_title, task_description, main_topic, image, status, reminder];

  try {
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database insert error:', err.stack);
    res.status(500).json({ error: 'Database insert error', details: err.message });
  }
});

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  const query = 'SELECT * FROM consumertasks';

  try {
    const result = await pool.query(query);
    res.json(result.rows); // Return all tasks
  } catch (err) {
    console.error('Database query error:', err.stack);
    res.status(500).json({ error: 'Database query error', details: err.message });
  }
});


// Get task details by ID
app.get('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;

  const query = 'SELECT * FROM consumertasks WHERE id = $1';
  const values = [id];

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(result.rows[0]); // Return the task details
  } catch (err) {
    console.error('Database query error:', err.stack);
    res.status(500).json({ error: 'Database query error', details: err.message });
  }
});


// add topic post code
app.post('/api/topics', async (req, res) => {
  const { topic_name, topic_image } = req.body;

  // Ensure the topic_name is provided
  if (!topic_name) {
    return res.status(400).json({ error: 'topic_name is required' });
  }

  // img_name is based on topic_name
 

  // SQL query to insert into topics table
  const query = `
    INSERT INTO topics (topic_name, topic_image)
    VALUES ($1, $2) RETURNING *
  `;
  const values = [topic_name, topic_image];

  try {
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]); // Return the newly added topic
  } catch (err) {
    console.error('Database insert error:', err.stack);
    res.status(500).json({ error: 'Database insert error', details: err.message });
  }
});


// Get all topics
app.get('/api/topics', async (req, res) => {
  const query = 'SELECT * FROM topics';
  try {
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Database fetch error:', err.stack);
    res.status(500).json({ error: 'Database fetch error', details: err.message });
  }
});

// 
// Get all tasks
app.get('/api/tasks', async (req, res) => {
  const query = 'SELECT * FROM consumertasks';
  
  try {
    const result = await pool.query(query);
    res.json(result.rows); // Return all tasks
  } catch (err) {
    console.error('Database query error:', err.stack);
    res.status(500).json({ error: 'Database query error', details: err.message });
  }
});






//assign task topic
app.post('/api/assign-task', async (req, res) => {
  const { consumer, task } = req.body;

  // Ensure both consumer and task are provided
  if (!consumer || !task) {
      return res.status(400).json({ error: 'Consumer and task are required' });
  }

  // SQL query to insert into the assigntask table
  const query = `
      INSERT INTO assigntask (consumer, task)
      VALUES ($1, $2) RETURNING *
  `;
  const values = [consumer, task];

  try {
      const result = await pool.query(query, values);
      res.status(201).json(result.rows[0]); // Return the newly assigned task
  } catch (err) {
      console.error('Database insert error:', err.stack);
      res.status(500).json({ error: 'Database insert error', details: err.message });
  }
});


// Get all assigned tasks
app.get('/api/assign-task', async (req, res) => {
  const query = 'SELECT * FROM assigntask';
  try {
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Database fetch error:', err.stack);
    res.status(500).json({ error: 'Database fetch error', details: err.message });
  }
});





// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
