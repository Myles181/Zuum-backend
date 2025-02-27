const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');
const setupSwagger = require('./swagger');
const passport = require('passport');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(bodyParser.json());
app.use(express.json()); // ✅ Required for JSON body parsing


app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());


// Import and use your routes
const authRoutes = require('./routes/Auth.routes');
app.use('/auth', authRoutes);

// Setup Swagger Documentation
setupSwagger(app);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});
