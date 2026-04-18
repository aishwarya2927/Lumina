require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 3000;

// Connect to MongoDB and Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running in production-ready mode on port ${PORT}`);
  });
});