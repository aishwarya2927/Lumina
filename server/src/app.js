const express = require('express');
const cors = require('cors');
const subjectRoutes = require('./routes/subject.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/subjects', subjectRoutes);
app.use('/attendance', attendanceRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;