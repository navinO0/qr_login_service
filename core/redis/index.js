// Import the ioredis library
const Redis = require('ioredis');

// Create a new Redis client instance
const redis = new Redis(); // Defaults to 127.0.0.1:6379

// Function to store data in Redis with expiration time (in seconds)
function storeData(key, value, expirationTime) {
    redis.setex(key, expirationTime, value, (err, result) => {
        if (err) {
            console.error("Error storing data:", err);
        } else {
            console.log(`Data stored: ${result}`);
        }
    });
}

// Function to retrieve data from Redis
function retrieveData(key) {
   return  redis.get(key, (err, result) => {
        if (err) {
            console.error("Error retrieving data:", err);
        } else {
            if (result === null) {
                return null
            } else {
                console.log(`Data retrieved: ${result}`);
                return result
            }
        }
   });
    
}

// Function to delete data from Redis
function deleteData(key) {
    redis.del(key, (err, result) => {
        if (err) {
            console.error("Error deleting data:", err);
        } else {
            console.log(`Data deleted: ${result}`);
        }
    });
}

module.exports = { storeData, retrieveData, deleteData }