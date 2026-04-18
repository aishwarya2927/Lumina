const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subject.controller');
const asyncWrapper = require('../utils/asyncWrapper');

router.post('/', asyncWrapper(subjectController.createSubject));

module.exports = router;