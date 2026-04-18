const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const asyncWrapper = require('../utils/asyncWrapper');

router.post('/mark', asyncWrapper(attendanceController.markAttendance));
router.get('/:subjectId', asyncWrapper(attendanceController.getAnalytics));

module.exports = router;