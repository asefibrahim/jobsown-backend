const express = require("express");
const { getBlogsCollection } = require("../db/collections");
const { ObjectId } = require("mongodb");
const router = express.Router();
const bc = 0;
// Define all your blog-related

router.get("/blogs", async (req, res) => {
  try {
    const jobs = await getBlogsCollection.find({}).toArray();

    res.json(jobs);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
router.get("/blogs/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const blogsCollection = getBlogsCollection();
    const job = await blogsCollection.findOne({ _id: new ObjectId(id) });

    if (!job) {
      return res.status(404).send("Job not found");
    }
    res.json(job);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
