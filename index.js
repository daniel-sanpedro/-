const pg = require("pg");
const express = require("express");
const morgan = require("morgan");

// Create a new client instance with the connection string to your database
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/the_acme_notes_db"
);

// Create an Express application
const app = express();

// Middleware to parse incoming JSON requests
app.use(express.json());

// Middleware to log requests
app.use(morgan("dev"));

// Async function to initialize database and seed data
const init = async () => {
  try {
    // Connect to the database
    await client.connect();
    console.log("connected to database");

    // Drop the notes table if it exists and create a new one
    let SQL = `
      DROP TABLE IF EXISTS notes;
      CREATE TABLE notes (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        ranking INTEGER DEFAULT 3 NOT NULL,
        txt VARCHAR(255) NOT NULL
      );
    `;
    await client.query(SQL);
    console.log("tables created");

    // Insert data into the notes table
    SQL = `
      INSERT INTO notes (txt, ranking) VALUES 
      ('First note', 5),
      ('Second note', 3),
      ('Third note', 4);
    `;
    await client.query(SQL);
    console.log("data seeded");

    // Start the server
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`listening on port ${port}`);
    });
  } catch (err) {
    console.error(err);
  }
};

// CRUD routes for notes

// CREATE
app.post("/api/notes", async (req, res, next) => {
  try {
    const { txt, ranking } = req.body;
    const SQL = "INSERT INTO notes (txt, ranking) VALUES ($1, $2) RETURNING *";
    const response = await client.query(SQL, [txt, ranking]);
    res.status(201).send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// READ
app.get("/api/notes", async (req, res, next) => {
  try {
    const SQL = "SELECT * FROM notes ORDER BY created_at DESC";
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// UPDATE
app.put("/api/notes/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { txt, ranking } = req.body;
    const SQL =
      "UPDATE notes SET txt=$1, ranking=$2, updated_at=now() WHERE id=$3 RETURNING *";
    const response = await client.query(SQL, [txt, ranking, id]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE
app.delete("/api/notes/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const SQL = "DELETE FROM notes WHERE id=$1";
    await client.query(SQL, [id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

// Invoke the init function
init();
