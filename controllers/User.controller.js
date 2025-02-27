const db = require('../config/db.conf');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = 'SECRET-KEY';
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;


exports.signup = async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        await db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
        
        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/callback",
    passReqToCallback: true
  },
  async function(request, accessToken, refreshToken, profile, done) {
    try {
        // Check if the user already exists in the database
        const [users] = await db.query('SELECT * FROM users WHERE google_id = ?', [profile.id]);
        if (users.length > 0) {
            return done(null, users[0]); 
        }
        // User does not exist, proceed to create a new user
        const newUser = {
            username: profile.displayName,
            email: profile.emails[0].value, // Ensure you're accessing the correct email
            google_id: profile.id
        };
        await db.query(
            'INSERT INTO users (username, email, google_id) VALUES (?, ?, ?)', 
            [newUser.username, newUser.email, newUser.google_id]
        );
        const [createdUser] = await db.query('SELECT * FROM users WHERE google_id = ?', [profile.id]);
        return done(null, createdUser[0]);
    } catch (error) {
        console.error('Error in Google OAuth strategy:', error.sqlMessage || error.message); // Log the error message
        return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        done(null, users[0]);
    } catch (error) {
        console.error('Error in deserializeUser:', error.sqlMessage || error.message); // Log the error message
        done(error, null);
    }
});

