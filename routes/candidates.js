const express = require("express");
const { getCandidatesCollection, getAppliedJobsCollection, getSavedCandidatesCollection } = require("../db/collections");
const { ObjectId } = require("mongodb");
const router = express.Router();

// Define all your candidates-related routes here
// Example route:
router.get("/candidates", async (req, res) => {
  try {
    const { keyword, currentCity, minExperience, maxExperience, minSalary, maxSalary, education, cvLink, searchIndustries, gender, minAge, maxAge, language } = req?.query;

    const candidatesCollection = getCandidatesCollection();
    let filter = {};
    if (keyword) {
      filter['preferred_job_title'] = { $regex: keyword, $options: "i" };
      // filter.skills = { $in: [new RegExp(keyword, 'i')] };
    }
    if(currentCity){
      filter['location'] = { $regex: currentCity, $options: "i" };
    }
    
    const minExperienceNum = parseInt(minExperience);
    const maxExperienceNum = parseInt(maxExperience);

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
    }

    // sorting by industries
    if(searchIndustries){
      filter['experience'] = {
        $elemMatch: {
          'department': { $regex: searchIndustries, $options: "i" }
        }
      };
    }

    // sorting by gender
    if(gender){
      filter['gender'] = gender;
    }

   
    // sorting by age
    const minAgeNum = parseInt(minAge);
    const maxAgeNum = parseInt(maxAge);

    if (minAgeNum && maxAgeNum) {
      filter['age'] = { $gte: minAgeNum, $lte: maxAgeNum };
    } else if (minAgeNum) {
      filter['age'] = { $gte: minAgeNum };
    } else if (maxAgeNum) {
      filter['age'] = { $lte: maxAgeNum };
    }

    // sort by age num
    if(language){
      filter['languages'] = { $in: [new RegExp(language, 'i')] };
    }

    const data = await candidatesCollection.find(filter).toArray();
    // console.log(data);
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

// post or update a candidates information
router.post("/addcandidate", async(req, res) => {
  // receive new candidate info
  try {
    const newCandidate = req.body;
  const candidatesCollection = getCandidatesCollection();
  const isExist = await candidatesCollection.findOne({email: newCandidate.email});
  // if candidate exist
  if(isExist === null){
    const result = await candidatesCollection.insertOne(newCandidate);
    res.send(result);
    return
  }
  const filter = {email: newCandidate.email};
  const options = { upsert: true };
  const updateDoc = {
    $set: newCandidate
  };
  const result = await candidatesCollection.updateOne(filter, updateDoc, options);
  res.send(result);
  } catch (error) {
    res.status(500).send(error)
  }

})

// get a specific candiates info
router.get("/candidate-info/:email", async(req, res) => {
  try {
    const userEmail = req.params?.email;
    const candidatesCollection = getCandidatesCollection();
    const result = await candidatesCollection.findOne({email: userEmail});
    res.send(result);
  } catch (error) {
    res.status(500).send(error)
  }
})

// get candidate information by id
router.get("/candidate-details/:id", async(req, res) => {
  try {
    const id = req.params?.id;
    const candidatesCollection = getCandidatesCollection();
    const result = await candidatesCollection.findOne({_id: new ObjectId(id)});
    res.send(result);
  } catch (error) {
    res.status(500).send(error)
  }
})

// get applied candidates
router.get("/applied-candidates/:id", async(req, res) => {
  try {
    const id = req.params?.id;
    const appliedJobsCollecation = getAppliedJobsCollection();
    const result = await appliedJobsCollecation.find({jobId: id}).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send(error)
  }
})

// saved and unsaved candidates collection
router.post("/save-candidate", async(req, res) => {
  // receive new candidate info
  try {
    const candidate = req?.body;
    console.log(candidate);
  const savecandidatesCollection = getSavedCandidatesCollection();
  const isExist = await savecandidatesCollection.findOne({savedEmail: candidate?.savedEmail, candidateId: candidate?.candidateId});
  console.log("is Exist", isExist);
  // if candidate exist
  if(isExist === null){
    const result = await savecandidatesCollection.insertOne(candidate);
    res.send(result);
    return
  }
  const result = await savecandidatesCollection.deleteOne({savedEmail: candidate?.savedEmail, candidateId: candidate?.candidateId});
  res.send(result);
  } catch (error) {
    res.status(500).send(error)
  }

})

// get my saved candidates ids
router.get("/mysaved-candidates/:email", async(req, res) => {
  try {
    const email = req.params?.email;
    const savecandidatesCollection = getSavedCandidatesCollection();
    const result = await savecandidatesCollection.find({savedEmail: email}).toArray();
    console.log('my saved applied candidates are', result);
    res.send(result);
  } catch (error) {
    res.status(500).send(error)
  }
})

// ... more routes

module.exports = router;
