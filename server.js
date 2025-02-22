// npm
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const port = process.env.port || 4000;
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('morgan');

// Import routers
const authRouter = require('./controllers/auth');
const usersRouter = require('./controllers/users');
const logsRouter = require("./controllers/logs.js");

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger('dev'));

// Routes
app.get('/', (req,res) => {
  res.send("Hello, world!")
});

app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use("/logs", logsRouter);

// Start the server and listen on port 3000
app.listen(port, () => {
  console.log('The express app is ready!');
});
