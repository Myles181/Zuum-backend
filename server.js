const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const setupSwagger = require('./swagger');
const { create_db_tables } = require('./create_tables');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(bodyParser.json());
app.use(express.json()); // ✅ Required for JSON body parsing

// Import and use your routes
const authRoutes = require('./routes/Auth.routes');
app.use('/auth', authRoutes);

// Setup Swagger Documentation
setupSwagger(app);

// Create new tables if any
create_db_tables();


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});
