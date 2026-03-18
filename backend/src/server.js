const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');
const priceRoutes = require('./routes/price');
const stockRoutes = require("./routes/stocks");
require('./db'); // connect to Mongo

const app = express();
app.use(cors());
app.use(express.json());


app.use("/api/stocks", stockRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/price', priceRoutes);

app.get('/', (req, res) => res.json({ ok: true }));

module.exports = app;
