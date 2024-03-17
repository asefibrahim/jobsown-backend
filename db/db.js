const { MongoClient, ServerApiVersion } = require("mongodb");

// Replace 'yourConnectionString' with your actual connection string
const uri =
  "mongodb+srv://jobsown:VNeCaq3DRVy7Jfwk@cluster0.5niozn3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connectToDb() {
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB yeeeeeeeeeee");
    // Perform actions on the collection object
  } catch (err) {
    console.error("Database connection failed", err);
    process.exit();
  }
}

module.exports = { client, connectToDb };
