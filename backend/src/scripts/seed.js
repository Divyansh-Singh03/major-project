require('dotenv').config();
const mongoose = require('../db'); // will connect via db.js
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Holding = require('../models/Holding');

async function run() {
  try {
    console.log('Seeding DB...');
    // delete previous demo (optional)
    await User.deleteMany({ email: 'demo@example.com' });
    await Portfolio.deleteMany({});
    await Holding.deleteMany({});

    const hash = await bcrypt.hash('demo123', 10);
    const user = await User.create({ email: 'demo@example.com', password_hash: hash });
    const portfolio = await Portfolio.create({ user: user._id, name: 'Main' });

    await Holding.create([
      { portfolio: portfolio._id, symbol: 'AAPL', shares: 10, avg_buy_price: 120 },
      { portfolio: portfolio._id, symbol: 'TSLA', shares: 5, avg_buy_price: 600 },
      { portfolio: portfolio._id, symbol: 'MSFT', shares: 8, avg_buy_price: 200 }
    ]);

    console.log('Seed complete. Demo user: demo@example.com / demo123');
    process.exit(0);
  } catch(err) {
    console.error(err);
    process.exit(1);
  }
}

run();
