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

// start of api
//user api for post
app.post('/api/users', async (req, res) => {
  const {
    user_name,
    user_email,
    user_password,
    user_emergency_contact_information,
    user_role
  } = req.body;

  // Ensure all fields are provided
  if (!user_name || !user_email || !user_password || !user_emergency_contact_information || !user_role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const query = `
    INSERT INTO users (user_name,
    user_email,
    user_password,
    user_emergency_contact_information,
    user_role)
    VALUES ($1, $2, $3, $4, $5) RETURNING *
  `;
  const values = [user_name,
    user_email,
    user_password,
    user_emergency_contact_information,
    user_role];

  try {
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]); // Return the newly added user
  } catch (err) {
    console.error('Database insert error:', err.stack);
    res.status(500).json({ error: 'Database insert error', details: err.message });
  }
});
//end user post api


// user api for fetch
app.get('/api/users', async (req, res) => {
  const query = `SELECT * FROM users`;

  try {
    const result = await pool.query(query);
    res.status(200).json(result.rows); // Return all users
  } catch (err) {
    console.error('Database fetch error:', err.stack);
    res.status(500).json({ error: 'Database fetch error', details: err.message });
  }
});
// get api end

//user api for update
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const {
    user_name,
    user_email,
    user_password,
    user_emergency_contact_information,
    user_role
  } = req.body;

  const query = `
    UPDATE users
    SET user_name = $1, user_email = $2, user_password = $3, user_emergency_contact_information = $4, user_role = $5
    WHERE id = $6 RETURNING *
  `;
  const values = [ user_name,
    user_email,
    user_password,
    user_emergency_contact_information,
    user_role,
     id];

  try {
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(result.rows[0]); // Return the updated user
  } catch (err) {
    console.error('Database update error:', err.stack);
    res.status(500).json({ error: 'Database update error', details: err.message });
  }
});
//user api for update end


// POST API to create a new package
app.post('/api/packages', async (req, res) => {
  const { package_name, short_desc, amount_monthly, yearly_discount, users_allowed, features } = req.body;

  // Validate all required fields
  if (!package_name || !short_desc || !amount_monthly || !users_allowed || !features) {
    return res.status(400).json({ error: 'All required fields must be provided.' });
  }

  const query = `
    INSERT INTO packages (package_name, short_desc, amount_monthly, yearly_discount, users_allowed, features)
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
  `;
  const values = [package_name, short_desc, amount_monthly, yearly_discount, users_allowed, JSON.stringify(features)];

  try {
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]); // Return the newly created package
  } catch (err) {
    console.error('Error inserting data:', err);
    res.status(500).json({ error: 'Database error' });
  }
});



// GET API to fetch all packages
app.get('/api/packages', async (req, res) => {
  const query = `SELECT * FROM packages`;

  try {
    const result = await pool.query(query);
    res.status(200).json(result.rows); // Return all packages
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete package
app.delete('/api/packages/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM packages WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }
    res.status(200).json({ message: 'Package deleted successfully', package: result.rows[0] });
  } catch (err) {
    console.error('Error deleting package:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update package
app.put('/api/packages/:id', async (req, res) => {
  const { id } = req.params;
  const { package_name, short_desc, amount_monthly, yearly_discount, users_allowed, features } = req.body;

  // Validate the input
  if (!package_name || amount_monthly == null || users_allowed == null) {
    return res.status(400).json({ error: 'Package name, amount monthly, and users allowed are required' });
  }

  try {
    // Convert features array of objects to a string format
    const featuresList = JSON.stringify(features); // Convert features to a JSON string

    console.log('Updating package with ID:', id, 'with values:', [
      package_name,
      short_desc,
      amount_monthly,
      yearly_discount,
      users_allowed,
      featuresList // Use the stringified features
    ]);
    
    // Update the package in the database
    const result = await pool.query(
      `UPDATE packages
       SET package_name = $1,
           short_desc = $2,
           amount_monthly = $3,
           yearly_discount = $4,
           users_allowed = $5,
           features = $6
       WHERE id = $7 RETURNING *`,
      [package_name, short_desc, amount_monthly, yearly_discount, users_allowed, featuresList, id] // Pass the JSON stringified features
    );

    // Check if the package was found and updated
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Return the updated package
    res.status(200).json({ message: 'Package updated successfully', package: result.rows[0] });
  } catch (err) {
    console.error('Error updating package:', err.message);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// end of api






// Start the server
const PORT =  8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});