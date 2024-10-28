import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
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


app.get('/api/packages/:id', async (req, res) => {
  const { id } = req.params; // Get the package ID from the request parameters
  const query = `SELECT * FROM packages WHERE id = $1`;

  try {
    const result = await pool.query(query, [id]); // Pass the ID as a parameter to the query

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' }); // Handle case where no package is found
    }

    res.status(200).json(result.rows[0]); // Return the first row (single package)
  } catch (err) {
    console.error('Error fetching data:', err);
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

// app.post('/api/consumers', async (req, res) => {
//   const { name, email, relationship, emergency_contact, password, preferenceForms, admin_id } = req.body;

//   try {
//     // Single query to insert into both consumers and users
//     const query = `
//       WITH inserted_consumer AS (
//         INSERT INTO consumers (name, email, relationship, emergency_contact, password, preferences, admin_id)
//         VALUES ($1, $2, $3, $4, $5, $6, $7)
//         RETURNING *
//       )
//       INSERT INTO users (user_name, user_email, user_password,user_emergency_contact_information, user_role)
//       SELECT name, email, password, emergency_contact, 'consumer' FROM inserted_consumer
//       RETURNING *;
//     `;

//     // Execute the query
//     const result = await pool.query(query, [
//       name,
//       email,
//       relationship,
//       emergency_contact,
//       password,
//       JSON.stringify(preferenceForms), // preferences field
//       admin_id, // admin_id field
//     ]);

//     const newUser = result.rows[0]; // This contains both consumer and user data

//     res.status(201).json({
//       message: 'Consumer and user data saved successfully!',
//       user: newUser
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error saving consumer and user data.', error: error.message });
//   }
// });
// app.post('/api/consumers', async (req, res) => {
//   const { name, email, relationship, emergency_contact, password, preferenceForms, admin_id } = req.body;

//   try {
//     // Hash the password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Single query to insert into both consumers and users
//     const query = `
//       WITH inserted_consumer AS (
//         INSERT INTO consumers (name, email, relationship, emergency_contact, password, preferences, admin_id)
//         VALUES ($1, $2, $3, $4, $5, $6, $7)
//         RETURNING *
//       )
//       INSERT INTO users (user_name, user_email, user_password, user_emergency_contact_information, user_role)
//       SELECT name, email, $8, emergency_contact, 'consumer' FROM inserted_consumer
//       RETURNING *;
//     `;
 
//       // Execute the query
//       const result = await pool.query(query, [
//         name,
//         email,
//         relationship,
//         emergency_contact,
//         hashedPassword, // Use hashed password for consumers table
//         JSON.stringify(preferenceForms), // preferences field
//         admin_id, // admin_id field
//         hashedPassword, // Use hashed password for users table
//       ]);
      
//       const newUser = result.rows[0]; // This contains both consumer and user data
      
//       res.status(201).json({
//         message: 'Consumer and user data saved successfully!',
//         user: newUser
//       });
//       // console.log(user_id,"12qwqwqw");
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Error saving consumer and user data.', error: error.message });
//     }
// });

app.post('/api/consumers', async (req, res) => {
  const { name, email, relationship, emergency_contact, password, preferenceForms, admin_id } = req.body;

  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // SQL query to insert into both consumers and users
    const query = `
      WITH inserted_user AS (
        INSERT INTO users (user_name, user_email, user_password, user_emergency_contact_information, user_role)
        VALUES ($1, $2, $3, $4, 'consumer')
        RETURNING id
      )
      INSERT INTO consumers (name, email, relationship, emergency_contact, password, preferences, admin_id, user_id)
      VALUES ($5, $6, $7, $8, $9, $10, $11, (SELECT id FROM inserted_user))
      RETURNING *;
    `;
    
    // Execute the query with correct parameter alignment
    const result = await pool.query(query, [
      name,                        // $1 -> users table: user_name
      email,                       // $2 -> users table: user_email
      hashedPassword,              // $3 -> users table: user_password
      emergency_contact,           // $4 -> users table: user_emergency_contact_information

      name,                        // $5 -> consumers table: name
      email,                       // $6 -> consumers table: email
      relationship,                // $7 -> consumers table: relationship
      emergency_contact,           // $8 -> consumers table: emergency_contact
      hashedPassword,              // $9 -> consumers table: password
      JSON.stringify(preferenceForms), // $10 -> consumers table: preferences
      admin_id                     // $11 -> consumers table: admin_id
    ]);

    const newUser = result.rows[0]; // Contains the newly created consumer data
    
    res.status(201).json({
      message: 'Consumer and user data saved successfully!',
      user: newUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error saving consumer and user data.', error: error.message });
  }
});


app.get('/api/consumers', async (req, res) => {
  // Get admin_id from the Authorization header
  const admin_id = req.headers.authorization?.split(' ')[1]; // assuming "Bearer {admin_id}"

  if (!admin_id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const result = await pool.query('SELECT * FROM consumers WHERE admin_id = $1', [admin_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error retrieving consumer data:', error);
    res.status(500).json({ message: 'Error retrieving consumer data.', error });
  }
});


app.get('/api/consumers/:id', async (req, res) => {
  // Get admin_id from the Authorization header
 

  try {
    const result = await pool.query('SELECT * FROM consumers where id = $1', [req.params.id]);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error retrieving consumer data:', error);
    res.status(500).json({ message: 'Error retrieving consumer data.', error });
  }
});

//delete api for get consumer
app.delete('/api/consumers/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM consumers WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Consumer not found.' });
    }

    res.status(200).json({
      message: 'Consumer deleted successfully!',
      deletedConsumer: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting consumer:', error);
    res.status(500).json({ message: 'Error deleting consumer.', error: error.message });
  }
}); 

    //end api for get consumer

//update api for get consumer
app.put('/api/consumers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, relationship, emergency_contact, password, preferenceForms } = req.body;

  try {
    const result = await pool.query(
      `UPDATE consumers 
       SET name = $1, email = $2, relationship = $3, emergency_contact = $4, password = $5, preferences = $6 
       WHERE id = $7 RETURNING *`,
      [name, email, relationship, emergency_contact, password, JSON.stringify(preferenceForms), id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Consumer not found.' });
    }

    const updatedConsumer = result.rows[0];
    res.status(200).json({
      message: 'Consumer updated successfully!',
      consumer: updatedConsumer,
    });
  } catch (error) {
    console.error('Error updating consumer:', error);
    res.status(500).json({ message: 'Error updating consumer.', error: error.message });
  } 
});



// end of api
  



//umer code
// app.post("/api/tasks", async (req, res) => {
//   const {
//     task_name,
//     consumerId,
//     reminderType,
//     reminderTime,
//     reminderDays,
//     admin_id,
//   } = req.body;
//   try {
//     const reminderDetails = {
//       reminderType,
//       reminderTime,
//       reminderDays: reminderType === "weekly" ? reminderDays : null, // Only set reminderDays if weekly
//     };
//     const query = `
//       INSERT INTO tasks (task_name, consumer_id, reminder_details, admin_id)
//       VALUES ($1, $2, $3, $4)
//       RETURNING *
//     `;
//     const values = [task_name, consumerId, reminderDetails, admin_id];
//     const result = await pool.query(query, values);
//     res.status(201).json(result.rows[0]);
//   } catch (error) {
//     console.error("Error creating task:", error);
//     res
//       .status(500)
//       .json({ message: "Error creating task.", error: error.message });
//   }
// });
app.post("/api/tasks", async (req, res) => {
  const {
    task_name,
    consumerId,
    reminderType,
    reminderTime,
    reminderDays,
    admin_id,
  } = req.body;

  try {
    const reminderDetails = {
      reminderType,
      reminderTime,
      reminderDays: reminderType === "weekly" ? reminderDays : null, // Only set reminderDays if weekly
    };

    // Step 1: Retrieve user_id from consumers table using consumerId
    const userQuery = `
      SELECT user_id FROM consumers WHERE id = $1
    `;
    const userResult = await pool.query(userQuery, [consumerId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Consumer not found." });
    }

    const userId = userResult.rows[0].user_id;
console.log(userId);

    // Step 2: Insert into tasks table with retrieved user_id
    const query = `
      INSERT INTO tasks (task_name, consumer_id, user_id, reminder_details, admin_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [task_name, consumerId, userId, reminderDetails, admin_id];
    const result = await pool.query(query, values);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Error creating task.", error: error.message });
  }
});







app.put("/api/tasks/:id", async (req, res) => {
  const { id } = req.params; // Get the task ID from the URL
  const {
    task_name,
    consumerId,
    reminderType,
    reminderTime,
    reminderDays,
    admin_id,
  } = req.body;

  try {
    const reminderDetails = {
      reminderType,
      reminderTime,
      reminderDays: reminderType === "weekly" ? reminderDays : null, // Only set reminderDays if weekly
    };

    const query = `
      UPDATE tasks
      SET task_name = $1,
          consumer_id = $2,
          reminder_details = $3,
          admin_id = $4
      WHERE id = $5
      RETURNING *
    `;
    const values = [task_name, consumerId, reminderDetails, admin_id, id];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.status(200).json(result.rows[0]); // Return the updated task
  } catch (error) {
    console.error("Error updating task:", error);
    res
      .status(500)
      .json({ message: "Error updating task.", error: error.message });
  }
});


app.get("/api/tasks", async (req, res) => {
  try {
    // Assuming you're getting the admin_id from the session or request
    const admin_id = req.headers.authorization?.split(" ")[1];
    if (!admin_id) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Admin ID not found" });
    }
    // Query to fetch tasks only for the logged-in admin
    const query = `
    SELECT tasks.*, consumers.name AS consumer_name
    FROM tasks
    JOIN consumers ON tasks.consumer_id = consumers.id
    WHERE tasks.admin_id = $1`;
    const result = await pool.query(query, [admin_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res
      .status(500)
      .json({ message: "Error fetching tasks", error: error.message });
  }
});


// app.get('/api/tasks/:id', async (req, res) => {
//   // Get admin_id from the Authorization header
 

//   try {
//     const result = await pool.query('SELECT * FROM tasks where user_id = $1', [req.params.id]);
//     res.status(200).json(result.rows[0]);
//   } catch (error) {
//     console.error('Error retrieving consumer data:', error);
//     res.status(500).json({ message: 'Error retrieving consumer data.', error });
//   }
// });
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No tasks found for this user.' });
    }
    
    res.status(200).json(result.rows); // Return all tasks associated with the user
  } catch (error) {
    console.error('Error retrieving task data:', error);
    res.status(500).json({ message: 'Error retrieving task data.', error: error.message });
  }
});






app.delete("/api/tasks/:id", async (req, res) => {
  const { id } = req.params; // Get the task ID from the URL
  try {
    const admin_id = req.headers.authorization?.split(" ")[1];
    if (!admin_id) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Admin ID not found" });
    }
    const query = `
      DELETE FROM tasks
      WHERE id = $1 AND admin_id = $2
      RETURNING *
    `;
    const values = [id, admin_id];
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res
      .status(500)
      .json({ message: "Error deleting task", error: error.message });
  }
});


// donotdisturb api

app.post('/api/consumers/donotdisturb', async (req, res) => {
  const { startTime, endTime, consumer_id, admin_id } = req.body;

  // Basic validation
  if (!startTime || !endTime || !consumer_id || !admin_id) {
    return res.status(400).json({
      message: 'All fields are required: startTime, endTime, user_id, and admin_id',
    });
  }

  try {
    // Insert or update Do Not Disturb settings for the user
    const query = `
      INSERT INTO donotdisturb (consumer_id, admin_id, start_time, end_time)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (consumer_id, admin_id) 
      DO UPDATE SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time
    `;
    
    const result = await pool.query(query, [consumer_id, admin_id, startTime, endTime]);

    // Return a success message
    res.status(200).json({
      message: 'Do Not Disturb settings saved successfully',
      data: {
        consumer_id,
        admin_id,
        startTime,
        endTime,
      },
    });
    
  } catch (error) {
    console.error('Error saving Do Not Disturb settings:', error);
    res.status(500).json({
      message: 'Error saving Do Not Disturb settings',
      error: error.message,
    });
  }
});



//consumer count
app.get('/api/consumers/count/:admin_id', async (req, res) => {
  const { admin_id } = req.params; // Retrieve admin_id from request query or session (e.g., next-auth session)
  try {
    // Step 1: Get the consumer count from the consumers table
    const consumerResult = await pool.query(
      'SELECT COUNT(*) AS consumer_count FROM consumers WHERE admin_id = $1',
      [admin_id]
    );
    const consumerCount = parseInt(consumerResult.rows[0].consumer_count, 10); // Convert to integer
    // Step 2: Get the users_allowed from the packages table
    const packageResult = await pool.query(
      'SELECT allowed_users FROM package_purchases WHERE admin_id = $1',
      [admin_id]
    );
    if (packageResult.rowCount === 0) {
      return res.status(404).json({
        message: 'No package found for the admin'
      });
    }
    const usersAllowed = parseInt(packageResult.rows[0].allowed_users, 10); // Convert to integer
    // Step 3: Compare consumer count with users_allowed
    const exceedsLimit = consumerCount >= usersAllowed;
    // Step 4: Respond with the comparison result
    res.status(200).json({
      message: exceedsLimit
        ? 'Consumer count exceeds the allowed limit'
        : 'Consumer count is within the allowed limit',
      consumerCount,
      usersAllowed,
      exceedsLimit
    });
  } catch (error) {
    console.error('Error fetching consumer count or package:', error);
    res.status(500).json({
      message: 'Error retrieving data',
      error: error.message
    });
  }
});
// app.get('/api/consumers/count/:admin_id', async (req, res) => {
//   const { admin_id } = req.params; // Retrieve admin_id from request query or session (e.g., next-auth session)
//   try {
//     // Step 1: Get the consumer count from the consumers table
//     const consumerResult = await pool.query(
//       'SELECT COUNT(*) AS consumer_count FROM consumers WHERE admin_id = $1',
//       [admin_id]
//     );
//     const consumerCount = parseInt(consumerResult.rows[0].consumer_count, 10); // Convert to integer
//     // Step 2: Get the users_allowed from the packages table
//     const packageResult = await pool.query(
//       'SELECT users_allowed FROM packages WHERE id = $1',
//       ['2']
//     );
//     if (packageResult.rowCount === 0) {
//       return res.status(404).json({
//         message: 'No package found for the admin'
//       });
//     }
//     const usersAllowed = parseInt(packageResult.rows[0].users_allowed, 10); // Convert to integer
//     // Step 3: Compare consumer count with users_allowed
//     const exceedsLimit = consumerCount >= usersAllowed;
//     // Step 4: Respond with the comparison result
//     res.status(200).json({
//       message: exceedsLimit
//         ? 'Consumer count exceeds the allowed limit'
//         : 'Consumer count is within the allowed limit',
//       consumerCount,
//       usersAllowed,
//       exceedsLimit
//     });
//   } catch (error) {
//     console.error('Error fetching consumer count or package:', error);
//     res.status(500).json({
//       message: 'Error retrieving data',
//       error: error.message
//     });
//   }
// });





//purchase api
app.post('/api/purchase', async (req, res) => {
  const { admin_id, package_id, package_name, price, allowed_users } = req.body;

  // Check if all required fields are provided
  if (!admin_id || !package_id || !package_name || !price) {
      return res.status(400).json({ error: 'All fields are required' });
  }

  try {
      // Insert the purchase into the database
      const query = `
          INSERT INTO package_purchases (admin_id, package_id, package_name, price, allowed_users)
          VALUES ($1, $2, $3, $4,$5)
          RETURNING *;
      `;
      const values = [admin_id, package_id, package_name, price,allowed_users];
      const result = await pool.query(query, values); // Assuming db.query connects to your database

      // Return the created purchase
      res.status(201).json({
          success: true,
          purchase: result.rows[0], // returning the created purchase record
      });
  } catch (error) {
      console.error('Error purchasing package:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/purchase', async (req, res) => {
  // Get admin_id from the Authorization header
  const authHeader = req.headers.authorization;
  const admin_id = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!admin_id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const result = await pool.query('SELECT * FROM package_purchases WHERE admin_id = $1', [admin_id]);
    
    // Check if the user has purchased a package
    if (result.rows.length > 0) {
      return res.status(200).json({ hasPurchased: true, purchases: result.rows });
    } else {
      return res.status(200).json({ hasPurchased: false });
    }
    
  } catch (error) {
    console.error('Error retrieving consumer data:', error);
    res.status(500).json({ message: 'Error retrieving consumer data.', error });
  }
});







//consumer task api
// app.get('/tasks', async (req, res) => {
//   try {
//     console.log(req.headers);
    
//     const consumer_id = req.headers.authorization?.split(" ")[1];
//     if (!consumer_id) {
//       return res
//         .status(401)
//         .json({ message: "Unauthorized: consumer ID not found" });
//     }
//     // Query to fetch tasks only for the specific consumer
//     const query = `
//       SELECT 
//        *
//       FROM tasks
//       WHERE tasks.consumer_id = $1
//     `
//     const result = await pool.query(query, [consumer_id])

//     // Format the response
//     const formattedTasks = result.rows.map(task => ({
//       ...task,
//       categories: task.categories.split(',').map(cat => cat.trim()) // Assuming categories are stored as comma-separated string
//     }))

//     res.status(200).json(formattedTasks)
//   } catch (error) {
//     console.error('Error fetching tasks:', error)
//     if (error.name === 'JsonWebTokenError') {
//       res.status(401).json({ message: 'Invalid token' })
//     } else {
//       res.status(500).json({ message: 'Error fetching tasks', error: error.message })
//     }
//   }
// })
app.get('/tasks/:consumer_id', async (req, res) => {
  try {
    const { consumer_id } = req.params; // Extract consumer_id from the URL parameters
    
    if (!consumer_id) {
      return res
        .status(401)
        .json({ message: "Unauthorized: consumer ID not provided" });
    }

    // Query to fetch tasks only for the specific consumer
    const query = `
      SELECT 
       *
      FROM tasks
      WHERE tasks.consumer_id = $1
    `;
    
    const result = await pool.query(query, [consumer_id]);

    // Format the response
    // const formattedTasks = result.rows.map(task => ({
    //   ...task,
    //   categories: task.categories.split(',').map(cat => cat.trim()) // Assuming categories are stored as comma-separated string
    // }));

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ message: 'Invalid token' });
    } else {
      res.status(500).json({ message: 'Error fetching tasks', error: error.message });
    }
  }
});



//mobile
app.get('/task/:id', async (req, res) => {
  try {
    const { id } = req.params; // Extract 'id' from the URL parameters
    
    if (!id) {
      return res
        .status(400) // Bad request, since id is required
        .json({ message: "Bad request: Task ID not provided" });
    }

    // Query to fetch the task by the given ID
    const query = `
      SELECT 
        *
      FROM tasks
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res
        .status(404) // Task not found
        .json({ message: "Task not found" });
    }

    // Send the fetched task as a response
    res.status(200).json(result.rows[0]);
   
    
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Server error' }); // Internal server error
  }
});
























// POST API for form submission
app.post('/api/submit-form', async (req, res) => {
  const {
      fullName,
      email,
      phone,
      role,
      otherRole,
      ageGroup,
      numCareFor,
      primaryCareNeeds,
      support,
      hearAbout,
      otherHearAbout,
      receiveUpdates,
      termsAccepted,
  } = req.body;

  // Check if required fields are provided
  if (!fullName || !email) {
      return res.status(400).json({ error: 'Full name and email are required' });
  }

  try {
      // Insert the submission into the database
      const query = `
          INSERT INTO user_submissions (full_name, email, phone, role, other_role, age_group, num_care_for, primary_care_needs, support, hear_about, other_hear_about, receive_updates, terms_accepted)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *;
      `;
      const values = [
          fullName,
          email,
          phone,
          role,
          otherRole,
          ageGroup,
          numCareFor,
          primaryCareNeeds,
          support,
          hearAbout,
          otherHearAbout,
          receiveUpdates,
          termsAccepted,
      ];
      const result = await pool.query(query, values);

      // Return the created submission
      res.status(201).json({
          success: true,
          submission: result.rows[0], // returning the created submission record
      });
  } catch (error) {
      console.error('Error submitting form:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});




app.get('/api/submissions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_submissions');  
    res.json(result.rows);
  } catch (error) {
    errorHandler(error, res);
  }
});










//api for superadmin dashboard data

// GET API to retrieve admin count from users table
app.get('/api/admin-count', async (req, res) => {
  try {
    // Query to count users with role = 'admin'
    const { rows } = await pool.query(
      `SELECT COUNT(id) AS adminCount FROM users WHERE user_role = $1`,
      ['admin']
    );
  
    // Extract the count from the result
    const adminCount = rows[0].admincount;
  
    // Send the admin count as a response
    res.status(200).json({ success: true, adminCount });
  } catch (error) {
    console.error('Error fetching admin count:', error);
    res.status(500).json({ error: 'Failed to fetch admin count' });
  }
  
});





// Assuming `pool` is already configured with your PostgreSQL connection
app.get('/api/total-purchase-price', async (req, res) => {
  try {
    // SQL query to get the sum of the price column
    const { rows } = await pool.query(
      `SELECT SUM(price) AS totalPrice FROM package_purchases`
    );

    // Extract the total price from the result
    const totalPrice = rows[0].totalprice;

    // Send the total price as a response
    res.status(200).json({ success: true, totalPrice });
  } catch (error) {
    console.error('Error fetching total purchase price:', error);
    res.status(500).json({ error: 'Failed to fetch total purchase price' });
  }
});



// Endpoint to fetch users with the role 'admin'
// Endpoint to fetch admin users and their package purchases
// Endpoint to fetch admin users and their package purchases
app.get('/api/admin-users-purchases', async (req, res) => {
  try {
    // Query to select admin users and their package purchase data
    const query = `
      SELECT u.id, u.created_at AS date, u.user_name AS name, pp.price
      FROM users u
      INNER JOIN package_purchases pp ON u.id = pp.admin_id
      WHERE u.user_role = $1;
    `;
    const values = ['admin'];
    const { rows } = await pool.query(query, values);

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching admin users and purchases:', error);
    res.status(500).json({ error: 'Failed to fetch admin users and purchases' });
  }
});



//end for superadmin dashboard data

// Start the server
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
