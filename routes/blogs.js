const express = require("express");
const { getBlogsCollection } = require("../db/collections");
const { ObjectId } = require("mongodb");
const router = express.Router();
const bc = 0;
// Define all your blog-related

router.get("/blogs", async (req, res) => {
  try {
    const jobs = await getBlogsCollection().find().toArray();
    console.log(jobs);
    res.json(jobs);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
router.get("/blogs/:id", async (req, res) => {

  try {
    const id = req.params?.id;
    const blogsCollection = getBlogsCollection();
    const job = await blogsCollection.findOne({_id: new ObjectId(id)});
    res.send(job);
  } catch (error) {
    res.status(500).send(error.message);
  }

});

module.exports = router;
