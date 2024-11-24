const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

// Route to retrieve a user by their ID.
router.get('/user/:userid', (req, res) => {
  const db = new sqlite3.Database(req.app.get('config').DATABASE);
  const userid = req.params.userid;

  // Validate that a user ID is provided.
  if (!userid) {
    res.status(400).json({ error: 'User ID is required' });
    return;
  }

  // Execute an SQL query to fetch the user from the database.
  db.get("SELECT * FROM users WHERE id = ?", [userid], (err, row) => {
    db.close();
    // Handle potential errors during the database query.
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Check if a user with the given ID was found.
    if (row) {
      res.json({ id: row.id, name: row.name, email: row.email });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  });
});

// Route to create a new user.
router.post('/user/', (req, res) => {
  const db = new sqlite3.Database(req.app.get('config').DATABASE);
  const data = req.body;

  // Execute an SQL query to insert a new user into the database.
  db.run("INSERT INTO users (name, email) VALUES (?, ?)", [data.name, data.email], function(err) {
    db.close();
    // Handle potential errors during the database insertion.
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Return a 201 Created response with the ID of the newly created user.
    // this.lastID is a property of the statement object, containing the ID of the last inserted row.
    res.status(201).json({ message: 'User created', id: this.lastID }); 
  });
});

module.exports = router;
