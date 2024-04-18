const express = require("express");
const {
  getJobsCollection,
  getAppliedJobsCollection,
  getSavedJobsCollection,
} = require("../db/collections");
const { ObjectId } = require("mongodb");
const router = express.Router();

// Define alll your job-related routes here
// Define alll your job-related routes here
router.post("/jobs", async (req, res) => {
  try {
    const jobsData = req.body;

    // Ensure that jobsData is not empty
    if (!jobsData || Object.keys(jobsData).length === 0) {
      return res.status(400).json({ message: "Job data is required" });
    }

    const jobsCollection = getJobsCollection();

    // Insert the job data into the database
    const result = await jobsCollection.insertOne(jobsData);

    // Check if the insertion was successful
    if (result.acknowledged) {
      res.status(201).json({
        message: "Job created successfully",
        jobId: result.insertedId,
      });
    } else {
      throw new Error("Failed to create the job");
    }
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Error creating job: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.get("/savedJobsFromEmployee", async (req, res) => {
  const { email } = req.query; // Assuming the query parameter name is 'email'

  console.log("is server gott email", email);

  try {
    if (!email) {
      return res.status(400).json({ message: "Employee email is required" });
    }

    const jobsCollection = getJobsCollection();
    const jobs = await jobsCollection.find({ employeeEmail: email }).toArray();
    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error fetching jobs: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.delete("/savedJobsFromEmployee/:id", async (req, res) => {
  const { id } = req.params;
  console.log(id);

  try {
    const jobsCollection = getJobsCollection();
    const result = await jobsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/jobs", async (req, res) => {
  const {
    query,
    location,
    salaryRange,
    workType,
    genderType,
    page = 1,
  } = req.query;
  const limit = 5; // Fixed number of jobs per page
  const skip = (page - 1) * limit; // Jobs to skip based on current page

  try {
    // Dynamic Filter Construction
    let filter = {};
    if (query) {
      filter.JobTitle = { $regex: query, $options: "i" };
    }
    if (location) {
      filter.Location = { $regex: location, $options: "i" };
    }
    if (salaryRange) {
      filter.SalaryRange = { $regex: salaryRange, $options: "i" };
    }
    if (workType) {
      filter.JobType = { $regex: workType, $options: "i" };
    }
    if (genderType) {
      filter.Gender = { $regex: genderType, $options: "i" };
    }
    const jobsCollection = getJobsCollection();
    // Count total matching jobs before applying pagination
    const totalJobs = await jobsCollection.countDocuments(filter);

    // Fetch paginated jobs
    let jobs = await jobsCollection
      .find(filter)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Check if no jobs are available after filtering
    if (jobs.length === 0) {
      return res
        .status(200)
        .json({ message: "No jobs available based on the given filters" });
    }

    res.json({
      jobs: jobs,
      totalJobs: totalJobs,
      totalPages: Math.ceil(totalJobs / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error searching for jobs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// post saved jobs data by email
router.post("/jobs/saved", async (req, res) => {
  try {
    const { jobId, userEmail } = req.body; // assuming each job has a unique jobId and userId represents the user doing the bookmarking

    const savedJobsCollection = getSavedJobsCollection();

    // Check if the job is already bookmarked by the user
    const isBookmarked = await savedJobsCollection.findOne({
      jobId,
      userEmail,
    });

    let result;
    if (isBookmarked) {
      // If the job is bookmarked, remove the bookmark
      result = await savedJobsCollection.deleteOne({ jobId, userEmail });
    } else {
      // If the job is not bookmarked, add a bookmark
      result = await savedJobsCollection.insertOne({ jobId, userEmail });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error processing request");
  }
});

// get saved jobs data by email

router.get("/filteredJobs", async (req, res) => {
  try {
    const userEmail = req.query.email;
    if (!userEmail) {
      return res
        .status(400)
        .json({ message: "Email query parameter is required" });
    }
    console.log("email is", userEmail);
    const savedJobsCollection = getSavedJobsCollection();

    const jobsCollection = getJobsCollection();
    // Find all saved job entries for the given email
    const filter = { userEmail: { $eq: userEmail } };
    const savedJobs = await savedJobsCollection.find(filter).toArray();
    // Extract job IDs from savedJobs
    const jobIds = savedJobs.map((job) => new ObjectId(job.jobId));

    // Find all jobs that match the job IDs
    const jobs = await jobsCollection.find({ _id: { $in: jobIds } }).toArray();
    console.log(jobs);
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching filtered jobs:", error);
    res.status(500).json({ message: "Error fetching data" });
  }
});

// applied jobs related apis

router.post("/applied-jobs", async (req, res) => {
  try {
    const candidateData = req.body;
    console.log(candidateData);
    const appliedJobsCollection = getAppliedJobsCollection();
    const data = await appliedJobsCollection.insertOne(candidateData);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

// get applied jobs by email

router.get("/filterAppliedJobs", async (req, res) => {
  try {
    const userEmail = req.query.email;
    if (!userEmail) {
      return res
        .status(400)
        .json({ message: "Email query parameter is required" });
    }
    console.log("email is", userEmail);
    const appliedJobsCollection = getAppliedJobsCollection();
    const jobsCollection = getJobsCollection();
    // Find all applied job entries for the given email
    const appliedJobs = await appliedJobsCollection
      .find({ email: userEmail })
      .toArray();

    // Extract job IDs from appliedJobs
    const jobIds = appliedJobs.map((job) => new ObjectId(job.jobId));

    // Find all jobs that match the job IDs
    let jobs = await jobsCollection.find({ _id: { $in: jobIds } }).toArray();

    // Merge the 'status' field from appliedJobs into the jobs
    const jobsWithStatus = jobs.map((job) => {
      // Find the corresponding applied job entry
      const appliedJob = appliedJobs.find(
        (applied) => applied.jobId.toString() === job._id.toString()
      );

      // If the applied job entry exists, add 'status' to the job object
      return appliedJob ? { ...job, status: "applied" } : job;
    });
    console.log(jobsWithStatus);

    res.json(jobsWithStatus);
  } catch (error) {
    console.error("Error fetching filtered jobs:", error);
    res.status(500).json({ message: "Error fetching data" });
  }
});

// get all jobs

router.get("/allJobs", async (req, res) => {
  const jobsCollection = getJobsCollection();
  const result = await jobsCollection.find().toArray();
  res.send(result);
});

// get mainFilter jobs data

module.exports = router;
