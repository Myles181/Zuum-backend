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
const { Server } = require('socket.io'); // ✅ Import socket.io 
const http = require('http'); // ✅ Import http
const morgan = require("morgan");
const db = require('./config/db.conf.js');
const { startCronJob } = require('./cron-jobs/checkSubscription');
const { startCronJob: startPromotionCronJob } = require('./cron-jobs/checkPromotions');
const { startCronJob: startBeatPurchaseCronjob } = require('./cron-jobs/checkBeatDelivery');


const app = express();

const server = http.createServer(app); // ✅ Use http server
const io = new Server(server, {
  cors: { 
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }, // Allow all origins for now
});

const PORT = process.env.PORT || 5000;

app.use(morgan("dev")); // Logs HTTP requests

const corsOptions = {
  origin: [
    'https://zuum-backend-qs8x.onrender.com',
    'http://localhost:3000', 'http://localhost:5000',
    'http://localhost:5173', 'https://zuum-frontend.onrender.com', 'https://www.zuummusicpr.com',
    'https://zuum-frontend.vercel.app', 'https://df7c-2c0f-2a80-ae2-6f10-a9e7-90ed-9460-456b.ngrok-free.app'], // Allowed origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTION'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true, // Allow cookies if needed
};

app.use(cors(corsOptions));

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
const adminRoutes = require('./routes/Admin.routes');  
const userRoutes = require('./routes/User.routes');
const postAudioRoutes = require('./routes/Post.Audio.routes');
const postVideoRoutes = require('./routes/Post.Video.routes');
const postBeatRoutes = require('./routes/Post.Beat.routes');
const cloudinaryWebhook = require("./routes/cloudinaryWebhook");
const paymentRoutes = require('./routes/Payment.routes');
const notificationRoutes = require('./routes/Notification.routes')(io);  // ✅ Pass `io`

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/audio', postAudioRoutes);
app.use('/api/video', postVideoRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/beat', postBeatRoutes);
app.use('/api/admin', adminRoutes); // Admin routes


app.use("/webhook", cloudinaryWebhook);

// Setup Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Create new tables if any 
create_db_tables();

// ✅ WebSocket logic
io.on("connection", (socket) => {
  console.log(`⚡ User connected: ${socket.id}`);

  // User joins their own "room" for direct messages
  socket.on("joinChat", (userId) => {
    if (!userId) {
        console.log(`❌ joinChat called with no userId`);
        return;
    }
    socket.userId = userId;
    socket.join(userId.toString());
    console.log(`✅ User ${userId} joined their chat room (socket.userId: ${socket.userId})`);
  });

  socket.on("fetchMessages", async (roomId) => {
    try {
        const result = await db.query(
            `SELECT * FROM messages WHERE room_id = $1 ORDER BY created_at ASC`,
            [roomId]
        );
        socket.emit('recentMessages', result.rows); // Send back to requester
        console.log(`Fetched messages for room ${roomId} for socket ${socket.id}`);
    } catch (error) {
        console.error('Error fetching messages:', error);
        socket.emit('error', 'Failed to fetch messages');
    }
  });

  // Handle sending a message
  socket.on("sendMessage", async (messageData) => {
      const { content, receiverId, roomId } = messageData; // Message details
      const senderId = socket.userId; // From socket, set in joinChat

      if (!senderId) {
          // console.log(socket);
          console.log('❌ No userId set for socket');
          return;
      }
      if (!receiverId || !roomId) {
        console.log('❌ Required fields not passed');
        return;
      } 

      try {
          // Validate the roomId
          const roomExists = await db.query(
            `SELECT * FROM rooms
             WHERE room_id = $1`,
             [roomId]
          );

          if (roomExists.rowCount === 0) {
            console.log('❌ room id not found');
            return ;
          }

          // Save to DB
          const result = await db.query(
              `INSERT INTO messages (sender_id, receiver_id, room_id, content)
               VALUES ($1, $2, $3, $4) RETURNING *`,
              [senderId, receiverId, roomId, content]
          );
          const savedMessage = result.rows[0];

          // Prepare message for clients
          const messageToSend = {
              id: savedMessage.id,
              senderId: savedMessage.sender_id,
              receiverId: savedMessage.receiver_id,
              roomId: savedMessage.room_id,
              content: savedMessage.content,
              createdAt: savedMessage.created_at
          };

          // Send to receiver (direct message) or room (group chat)
          io.to(roomId).emit("receiveMessage", messageToSend);

          console.log(`✉️ Message sent from ${senderId}:`, messageToSend);
      } catch (error) {
          console.error('❌ Error saving message:', error);
      }
  });

  // Handle views
  socket.on("views", async (insightData) => {
      const { type, postId } = insightData; // Insight details
      const userId = socket.userId; // From socket, set in joinChat

      if (!userId) {
          console.log('❌ No userId set for socket');
          return;
      }
      if (!type || !postId) {
        console.log('❌ Required fields not passed');
        return ;
      }

      // Get the correct table name
      let tableName;
      if (type === 'beat') {
          tableName = 'post_audio_sell';
      } else if (type === 'audio') {
          tableName = 'post_audio';
      } else {
          tableName = 'post_video';
      }

      try {
          // Validate the postId
          const postExists = await db.query(
            `SELECT * FROM ${tableName}
             WHERE id = $1`,
             [postId]
          );

          if (postExists.rowCount === 0) {
            console.log('❌ post id not found');
            return ;
          }

          // Check if the user has already added to views
          const insightExists = await db.query(
            `SELECT * FROM views
             WHERE user_id = $1 AND type = $2 AND postId = $3`,
             [userId, type, postId]
          );

          if (insightExists.rowCount > 0) {
            console.log('❌ User has already added this insight');
            return ;
          }

          // Save to DB
          const result = await db.query(
              `INSERT INTO views (user_id, type, postId)
               VALUES ($1, $2, $3) RETURNING *`,
              [userId, type, postId]
          );
          const savedInsight = result.rows[0];

          // Increment the insight count in the respective post table
          await db.query(
              `UPDATE ${tableName}
               SET views = views + 1
               WHERE id = $1`,
              [postId]
          );

          // Prepare insight for clients
          const insightToSend = {
              id: savedInsight.id,
              userId: savedInsight.user_id,
              type: savedInsight.type,
              postId: savedInsight.post_id,
              createdAt: savedInsight.created_at
          };

          // Send to all clients
          io.emit("receiveInsight", insightToSend);

          console.log(`📊 Insight sent from ${userId}:`, insightToSend);
      } catch (error) {
          console.error('❌ Error saving insight:', error);
          return ;
      }
  });

  socket.on("disconnect", () => {
      console.log(`❌ User ${socket.userId || socket.id} disconnected`);
  });
});

// Start the cron job
startCronJob();
startPromotionCronJob();
startBeatPurchaseCronjob();

// Now uses server.listen instead of app.listen
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});
