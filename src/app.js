require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { filterSchools } = require('./services/filter');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// API route
app.post('/api/filterSchools', async (req, res) => {
  try {
    const filters = req.body;
    const results = await filterSchools(filters);
    res.json(results);
  } catch (err) {
    console.error('Error filtering schools:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
