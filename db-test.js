import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb+srv://samiyarahman561_db_user:kmn20glKUgoPEG78@cluster0.6hsbslx.mongodb.net/?appName=Cluster0');

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

export async function disconnectFromMongoDB() {
  await client.close();
}

// Call the function to test the connection immediately if this file is run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  connectToMongoDB().then(async () => {
    await disconnectFromMongoDB();
    console.log("Disconnected properly.");
  });
}
