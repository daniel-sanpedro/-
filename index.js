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
    // Perform your operations here
  } catch (err) {
    console.error("Connection error", err.stack);
  } finally {
    await client.end();
    console.log("Client disconnected");
  }
}

// Call the init function to establish connection
init();
