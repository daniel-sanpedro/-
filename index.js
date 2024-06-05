const pg = require("pg");
const express = require("express");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/the_acme_notes_db"
);
const app = express();

const { Client } = require("pg");

async function init() {
  const client = new Client({
    user: "yourUsername",
    host: "yourHost",
    database: "yourDatabase",
    password: "yourPassword",
    port: 5432,
  });

  try {
    console.log("Attempting to connect to the database...");
    await client.connect();
    console.log("Connected to the database successfully");

    SQL = `
            CREATE TABLE IF NOT EXISTS yourTable (
                id SERIAL PRIMARY KEY,
                column1 VARCHAR(50),
                column2 INT
            );
        `;
    await client.query(SQL);
    console.log("Tables created");

    SQL = `
            INSERT INTO yourTable (column1, column2) VALUES 
            ('data1', 100),
            ('data2', 200);
        `;
    await client.query(SQL);
    console.log("Data seeded");
  } catch (err) {
    console.error("Connection error", err.stack);
  } finally {
    await client.end();
    console.log("Client disconnected");
  }
}

init();
