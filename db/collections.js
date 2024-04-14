const { client } = require("./db");

const getCollection = (name) => {
  return client.db("jobsownDb").collection(name);
};

module.exports = {
  getJobsCollection: () => getCollection("jobs"),
  getSavedJobsCollection: () => getCollection("savedJobs"),
  getUsersCollection: () => getCollection("users"),
  getBlogsCollection: () => getCollection("blogs"),
  getAppliedJobsCollection: () => getCollection("appliedJobs"),
  getCandidatesCollection: () => getCollection("candidates"),
};
