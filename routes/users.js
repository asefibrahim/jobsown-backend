const express = require("express");
const { getUsersCollection } = require("../db/collections");
const router = express.Router();

// Define all your user-related routes here
// Example route:
router.post("/users", async (req, res) => {
  try {
    const { savedUser } = req.body;
    console.log(savedUser);

    // Check if savedUser is undefined or not an object
    if (!savedUser || typeof savedUser !== "object") {
      return res.status(400).send("Invalid user data");
    }

    const data = await getUsersCollection.insertOne(savedUser);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

// ... more routes

module.exports = router;
