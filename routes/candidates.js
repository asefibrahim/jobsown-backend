const express = require("express");
const { getCandidatesCollection } = require("../db/collections");
const router = express.Router();

// Define all your candidates-related routes here
// Example route:
router.get("/candidates", async (req, res) => {
  try {
    const { keyword, currentCity, minExperience, maxExperience, minSalary, maxSalary, education, cvLink, searchIndustries } = req?.query;
    console.log(keyword, currentCity, minExperience, maxExperience, minSalary, maxSalary, education, cvLink, searchIndustries);

    const candidatesCollection = getCandidatesCollection();
    let filter = {};
    if (keyword) {
      filter['experience.job_title'] = { $regex: keyword, $options: "i" };
      // filter.skills = { $in: [new RegExp(keyword, 'i')] };
    }
    if(currentCity){
      filter['experience.job_city'] = { $regex: currentCity, $options: "i" };
    }
    
    const minExperienceNum = parseInt(minExperience);
    const maxExperienceNum = parseInt(maxExperience);

    console.log("the min and max vaule are", minExperienceNum, maxExperienceNum);

    if (minExperienceNum && maxExperienceNum) {
      filter['experience_years'] = { $gte: minExperienceNum, $lte: maxExperienceNum };
    } else if (minExperienceNum) {
      filter['experience_years'] = { $gte: minExperienceNum };
    } else if (maxExperienceNum) {
      filter['experience_years'] = { $lte: maxExperienceNum };
    }

    const minSalaryNum = parseInt(minSalary);
    const maxSalaryNum = parseInt(maxSalary);

    if (minSalaryNum && maxSalaryNum) {
      filter['current_salary'] = { $gte: minSalaryNum, $lte: maxSalaryNum };
    } else if (minSalaryNum) {
      filter['current_salary'] = { $gte: minSalaryNum };
    } else if (maxSalaryNum) {
      filter['current_salary'] = { $lte: maxSalaryNum };
    }

    // sorting by education
    if(education){
      filter['education'] = { $regex: education, $options: "i" };
    }

    // sorting by cv
    if(cvLink) {
      filter['cv_link'] = { $exists: true, $ne: '' }; 
      console.log("cv link entered");
    }

    // sorting by industries
    if(searchIndustries){
      filter['experience.Department'] = { $regex: searchIndustries, $options: "i" };
    }
   
    console.log('line number',filter);

    const data = await candidatesCollection.find(filter).toArray();
    // console.log(data);
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

// ... more routes

module.exports = router;
