const subjectService = require('../services/subject.service');

exports.createSubject = async (req, res) => {
  const { name } = req.body;
  const subject = await subjectService.createSubject(name);
  res.status(201).json({ success: true, data: subject });
};