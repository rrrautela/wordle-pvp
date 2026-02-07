import express from "express";
import cors from "cors";
import dotenv from "dotenv";
// Import Express framework (used to create HTTP server and routes)
// Import CORS middleware (allows frontend on different port to call backend)
// Import dotenv (loads variables from .env into process.env)


// Load environment variables from .env file
dotenv.config();

// Create Express application instance (your backend server)
const app = express();


// Allow cross-origin requests (React → Node)
app.use(cors());

// Parse incoming JSON request bodies (req.body becomes usable)
app.use(express.json());


// Test route: runs when someone visits http://localhost:5000/
app.get("/", function(req, res){
    // Send plain text response back to browser / frontend
    res.send("bg running");
});


// Start server on port 5000
app.listen(5000, function(){

    // Print confirmation in terminal
    console.log("serverrr is running");
});
