const express = require("express");
const morgan = require("morgan");
const pg = require("pg");
const app = express();

const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/the_acme_flavors_db"
);

const PORT = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.url}`);
  next();
});

app.post("/api/flavors", async (req, res, next) => {
  try {
    console.log("Request body:", req.body); // Log the incoming request body
    const { name, is_favorite = false } = req.body;

    // Validate the request body
    if (!name) {
      return res.status(400).send({ error: "Name is required" });
    }

    console.log("Name:", name, "Is Favorite:", is_favorite); // Log extracted variables
    const SQL =
      "INSERT INTO flavors(name, is_favorite) VALUES($1, $2) RETURNING *;";
    const response = await client.query(SQL, [name, is_favorite]);
    console.log("Database response:", response.rows); // Log the database response
    res.status(201).send(response.rows[0]);
  } catch (error) {
    console.error("Error occurred while creating flavor:", error);
    next(error);
  }
});

app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = "SELECT * FROM flavors;";
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = "SELECT * FROM flavors WHERE id = $1;";
    const response = await client.query(SQL, [Number(req.params.id)]);
    if (response.rows.length === 0) {
      return res.status(404).send({ error: "Flavor not found" });
    }
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const { name, is_favorite } = req.body;
    let SQL, params;

    if (name !== undefined && is_favorite !== undefined) {
      SQL =
        "UPDATE flavors SET name = $1, is_favorite = $2, updated_at = now() WHERE id = $3 RETURNING *;";
      params = [name, is_favorite, req.params.id];
    } else if (name !== undefined) {
      SQL =
        "UPDATE flavors SET name = $1, updated_at = now() WHERE id = $2 RETURNING *;";
      params = [name, req.params.id];
    } else if (is_favorite !== undefined) {
      SQL =
        "UPDATE flavors SET is_favorite = $1, updated_at = now() WHERE id = $2 RETURNING *;";
      params = [is_favorite, req.params.id];
    } else {
      return res.status(400).send({ error: "No valid fields to update" });
    }

    const response = await client.query(SQL, params);
    if (response.rows.length === 0) {
      return res.status(404).send({ error: "Flavor not found" });
    }
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = "DELETE FROM flavors WHERE id = $1 RETURNING *;";
    const response = await client.query(SQL, [Number(req.params.id)]);
    if (response.rows.length === 0) {
      return res.status(404).send({ error: "Flavor not found" });
    }
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: "An unexpected error occurred!" });
});

const init = async () => {
  try {
    await client.connect();

    let SQL = "DROP TABLE IF EXISTS flavors;";
    SQL += "CREATE TABLE flavors(id SERIAL PRIMARY KEY,";
    SQL += "                     name VARCHAR(100) NOT NULL,";
    SQL += "                     is_favorite BOOLEAN DEFAULT FALSE,";
    SQL += "                     created_at TIMESTAMP DEFAULT now(),";
    SQL += "                     updated_at TIMESTAMP DEFAULT now());";

    SQL += "INSERT INTO flavors(name) VALUES('Chocolate');";
    SQL += "INSERT INTO flavors(name) VALUES('Cookies and Cream');";
    SQL += "INSERT INTO flavors(name) VALUES('Butter pecan');";

    await client.query(SQL);

    app.listen(PORT, () => {
      console.log(`Server started and listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
};

init();
