import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg"; // Import pg as a package
const { Pool } = pkg; // Destructure Pool from the imported package

dotenv.config(); // Load environment variables from .env file

const app = express();
app.use(cors());
app.use(express.json());

// Initialize the PostgreSQL connection pool
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || "postgresql://your-database-url",
});

// Verify connection to the database on server start
pool.connect((err, client, release) => {
  if (err) {
    console.error("Database connection error:", err.stack);
    process.exit(1); // Exit if there is a connection error
  } else {
    console.log("Database connected successfully");
    release();
  }
});

// Default route
app.get("/", (req, res) => {
  res.send("Hello World");
});

// start of api
//user api for post
app.post("/api/users", async (req, res) => {
  const {
    user_name,
    user_email,
    user_password,
    user_emergency_contact_information,
    user_role,
  } = req.body;

  // Ensure all fields are provided
  if (
    !user_name ||
    !user_email ||
    !user_password ||
    !user_emergency_contact_information ||
    !user_role
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const query = `
    INSERT INTO users (user_name,
    user_email,
    user_password,
    user_emergency_contact_information,
    user_role)
    VALUES ($1, $2, $3, $4, $5) RETURNING *
  `;
  const values = [
    user_name,
    user_email,
    user_password,
    user_emergency_contact_information,
    user_role,
  ];

  try {
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]); // Return the newly added user
  } catch (err) {
    console.error("Database insert error:", err.stack);
    res
      .status(500)
      .json({ error: "Database insert error", details: err.message });
  }
});
//end user post api

// user api for fetch
app.get("/api/users", async (req, res) => {
  const query = `SELECT * FROM users`;

  try {
    const result = await pool.query(query);
    res.status(200).json(result.rows); // Return all users
  } catch (err) {
    console.error("Database fetch error:", err.stack);
    res
      .status(500)
      .json({ error: "Database fetch error", details: err.message });
  }
});
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const {
    user_name,
    user_email,
    user_password,
    user_emergency_contact_information,
    user_role,
  } = req.body;

  const query = `
    UPDATE users
    SET user_name = $1, user_email = $2, user_password = $3, user_emergency_contact_information = $4, user_role = $5
    WHERE id = $6 RETURNING *
  `;
  const values = [
    user_name,
    user_email,
    user_password,
    user_emergency_contact_information,
    user_role,
    id,
  ];

  try {
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(result.rows[0]); // Return the updated user
  } catch (err) {
    console.error("Database update error:", err.stack);
    res
      .status(500)
      .json({ error: "Database update error", details: err.message });
  }
});

app.post("/api/contact", async (req, res) => {
  const { userName, companyName, phoneNumber, email, message } = req.body;

  const query = `
    INSERT INTO contact_data ( userName,
  companyName,
  phoneNumber,
  email,
  message)
    VALUES ($1, $2, $3, $4, $5) RETURNING *
  `;
  const values = [userName, companyName, phoneNumber, email, message];

  try {
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]); // Return the newly added user
  } catch (err) {
    console.error("Database insert error:", err.stack);
    res
      .status(500)
      .json({ error: "Database insert error", details: err.message });
  }
});
app.post("/api/community", async (req, res) => {
  const { email } = req.body;

  const query = `
    INSERT INTO community_data ( email )
    VALUES ($1) RETURNING *
  `;
  const values = [email];

  try {
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]); // Return the newly added user
  } catch (err) {
    console.error("Database insert error:", err.stack);
    res
      .status(500)
      .json({ error: "Database insert error", details: err.message });
  }
});

//user api for update end

// end of api

// Start the server
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
