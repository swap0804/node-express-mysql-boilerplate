const redis = require("redis");

// Initialize Redis client
const client = redis.createClient({
  url: "redis://localhost:6379",
});

// Handle connection errors
client.on("error", (err) => console.log("Redis Client Error", err));

// Connect to Redis
async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
  }
}

// Export the client and connectRedis function
module.exports = {
  client,
  connectRedis,
};
