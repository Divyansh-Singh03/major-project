require('dotenv').config();

// import express app factory (server.js should export the configured express app)
const app = require('./server');

// register routes BEFORE starting the server
const portfolioRoutes = require('./routes/portfolio');
app.use('/api/portfolio', portfolioRoutes);


// start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend (Mongo) running on http://localhost:${PORT}`));
