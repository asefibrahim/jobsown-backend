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

    // search jobs by name and location
    app.get("/jobs", async (req, res) => {
      const { query, location } = req.query;
      console.log("Query:", query, "Location:", location);
      try {
        const jobs = await jobsCollection
          .find({
            JobTitle: { $regex: query, $options: "i" },
            Location: { $regex: location, $options: "i" },
          })
          .toArray();

        res.json(jobs);
      } catch (error) {
        console.error("Error searching for jobs:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    app.get("/jobs/salary", async (req, res) => {
      const { salaryRange } = req.query; // "AED 60,000-AED 80,000"

      try {
        // Parse the salary range
        // Construct a regex pattern to match the salary range

        const jobs = await jobsCollection
          .find({
            SalaryRange: { $regex: salaryRange, $options: "i" },
          })
          .toArray();
        console.log(jobs);
        res.json(jobs);
      } catch (error) {
        res.status(500).send(error.message);
        console.log(error.message);
      }
    });
    app.get("/jobs/workType", async (req, res) => {
      const { workType } = req.query;
      try {
        const jobs = await jobsCollection
          .find({
            JobType: { $regex: workType, $options: "i" },
          })
          .toArray();
        console.log(jobs);
        res.json(jobs);
      } catch (error) {
        res.status(500).send(error.message);
        console.log(error.message);
      }
    });
    app.get("/jobs/genderType", async (req, res) => {
      const { genderType } = req.query;
      console.log(genderType);
      try {
        const jobs = await jobsCollection
          .find({
            Gender: { $regex: genderType, $options: "i" },
          })
          .toArray();
        console.log(jobs);
        res.json(jobs);
      } catch (error) {
        res.status(500).send(error.message);
        console.log(error.message);
      }
    });

    app.post("/jobs/saved", async (req, res) => {
      try {
        const { jobId, userId } = req.body; // assuming each job has a unique jobId and userId represents the user doing the bookmarking

        // Connect to the database and select the collection

        // Check if the job is already bookmarked by the user
        const isBookmarked = await savedJobsCollection.findOne({
          jobId,
          userId,
        });

        let result;
        if (isBookmarked) {
          // If the job is bookmarked, remove the bookmark
          result = await savedJobsCollection.deleteOne({ jobId, userId });
        } else {
          // If the job is not bookmarked, add a bookmark
          result = await savedJobsCollection.insertOne({ jobId, userId });
        }

        res.status(200).json(result);
      } catch (error) {
        console.error(error);
        res.status(500).send("Error processing request");
      }
    });

    app.get("/jobs", async (req, res) => {
      const result = await jobsCollection.find().toArray();
      res.send(result);
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
