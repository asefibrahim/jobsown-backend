const express = require("express");
const { getCandidatesCollection } = require("../db/collections");
const router = express.Router();

// Define all your candidates-related routes here
// Example route:
router.get("/candidates", async (req, res) => {
  try {
    const { keyword, currentCity, minExperience, maxExperience, minSalary, maxSalary, education } = req?.query;
    console.log(keyword, currentCity, minExperience, maxExperience, minSalary, maxSalary, education);


    // if (keyword) {
    //   const candidatesCollection = getCandidatesCollection();
    //   const data = await candidatesCollection.find({title: experience.job_title}).toArray();
    //   res.send(data);
    //   return 
    // }
 


    const candidatesCollection = getCandidatesCollection();
    const data = await candidatesCollection.find().toArray();
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

// ... more routes

module.exports = router;
