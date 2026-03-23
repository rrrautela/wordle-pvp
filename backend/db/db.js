


import dotenv from "dotenv";
dotenv.config();



// Import PostgreSQL client library (pg package)


// Destructure Pool class from pg package
// Pool manages multiple DB connections efficiently
import { Pool } from "pg";

// Create a connection pool to PostgreSQL database
export const pool = new Pool({

  // Database connection string coming from .env file

  // eslint-disable-next-line no-undef
  connectionString: process.env.DATABASE_URL


});
