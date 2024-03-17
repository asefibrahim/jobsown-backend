const express = require("express");
const cors = require("cors");
const jobsRouter = require("./routes/jobs");
const usersRouter = require("./routes/users");
const blogsRouter = require("./routes/blogs");
const errorHandler = require("./middleware/errorHandler");
const { connectToDb } = require("./db/db");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectToDb();

// Use the routers
app.use("/api", jobsRouter);
app.use("/api", usersRouter);
app.use("/api", blogsRouter);

// Root endpoint
app.get("/", (req, res) => {
  res.send("JobsOwn server is running...");
});

// Error handling middleware
app.use(errorHandler);

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
