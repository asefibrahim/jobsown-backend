const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.Db_User_Name}:${process.env.Db_Pass}@cluster0.5niozn3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const jobsCollection = client.db("jobsownDb").collection("jobs");
    const savedJobsCollection = client.db("jobsownDb").collection("savedJobs");
    const usersCollection = client.db("jobsownDb").collection("users");
    const blogsCollection = client.db("jobsownDb").collection("blogs");
    const appliedJobsCollection = client
      .db("jobsownDb")
      .collection("appliedJobs");

    // applied jobs related apis
    app.post("/applied-jobs", async (req, res) => {
      try {
        const candidateData = req.body;
        console.log(candidateData);

        const data = await appliedJobsCollection.insertOne(candidateData);
        res.json(data);
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send("An error occurred while processing your request.");
      }
    });
    // user related apis
    app.post("/users", async (req, res) => {
      try {
        const { savedUser } = req.body;
        console.log(savedUser);

        // Check if savedUser is undefined or not an object
        if (!savedUser || typeof savedUser !== "object") {
          return res.status(400).send("Invalid user data");
        }

        const data = await usersCollection.insertOne(savedUser);
        res.json(data);
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send("An error occurred while processing your request.");
      }
    });

    // blogs related apis
    app.get("/blogs", async (req, res) => {
      try {
        const jobs = await blogsCollection.find({}).toArray();

        res.json(jobs);
      } catch (error) {
        res.status(500).send(error.message);
      }
    });

    app.get("/blogs/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const job = await blogsCollection.findOne({ _id: new ObjectId(id) });

        if (!job) {
          return res.status(404).send("Job not found");
        }
        res.json(job);
      } catch (error) {
        res.status(500).send(error.message);
      }
    });

    // saved jobs

    app.post("/jobs/saved", async (req, res) => {
      try {
        const { jobId, userEmail } = req.body; // assuming each job has a unique jobId and userId represents the user doing the bookmarking

        // Connect to the database and select the collection

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
    app.get("/jobs/saved", async (req, res) => {
      try {
        const response = await savedJobsCollection.find().toArray();
        res.status(200).json(response);
      } catch (error) {
        // Log the error for debugging purposes
        console.error("Error occurred in /jobs/saved route:", error);

        // Send a server error response
        res
          .status(500)
          .json({ message: "An error occurred while retrieving saved jobs." });
      }
    });

    app.get("/filterAppliedJobs", async (req, res) => {
      try {
        const userEmail = req.query.email;
        if (!userEmail) {
          return res
            .status(400)
            .json({ message: "Email query parameter is required" });
        }
        console.log("email is", userEmail);

        // Find all applied job entries for the given email
        const appliedJobs = await appliedJobsCollection
          .find({ email: userEmail })
          .toArray();

        // Extract job IDs from appliedJobs
        const jobIds = appliedJobs.map((job) => new ObjectId(job.jobId));

        // Find all jobs that match the job IDs
        let jobs = await jobsCollection
          .find({ _id: { $in: jobIds } })
          .toArray();

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

    app.get("/filteredJobs", async (req, res) => {
      try {
        const userEmail = req.query.email;
        if (!userEmail) {
          return res
            .status(400)
            .json({ message: "Email query parameter is required" });
        }
        console.log("email is", userEmail);
        // Find all saved job entries for the given email
        const savedJobs = await savedJobsCollection
          .find({
            userEmail: userEmail,
          })
          .toArray();
        console.log(savedJobs);
        // Extract job IDs from savedJobs
        const jobIds = savedJobs.map((job) => new ObjectId(job.jobId));
        console.log(jobIds);
        // Find all jobs that match the job IDs
        const jobs = await jobsCollection
          .find({ _id: { $in: jobIds } })
          .toArray();
        console.log(jobs);
        res.json(jobs);
      } catch (error) {
        console.error("Error fetching filtered jobs:", error);
        res.status(500).json({ message: "Error fetching data" });
      }
    });

    app.get("/allJobs", async (req, res) => {
      const result = await jobsCollection.find().toArray();
      res.send(result);
    });

    // experiment

    app.get("/jobs", async (req, res) => {
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

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Jobsown is on............");
});

app.listen(port);
