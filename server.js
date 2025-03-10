const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');
const { swaggerUi, swaggerSpec } = require('./swagger');
const { create_db_tables } = require('./create_tables');
const passport = require('passport');
const session = require('express-session');
const cloudinary = require('cloudinary').v2;
const fileUpload = require('express-fileupload');


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(bodyParser.json());
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));
app.use(express.json()); // ✅ Required for JSON body parsing

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


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
const userRoutes = require('./routes/User.routes');
const postAudioRoutes = require('./routes/Post.Audio.routes');
const cloudinaryWebhook = require("./routes/cloudinaryWebhook");

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/audio', postAudioRoutes);
app.use("/webhook", cloudinaryWebhook);

// Setup Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Create new tables if any
create_db_tables();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});
