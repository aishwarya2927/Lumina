const subjectService = require('../services/subject.service');
const intelligenceService = require('../services/intelligence.service');

exports.markAttendance = async (req, res) => {
  const { subjectId, attended } = req.body;
  
  if (typeof attended !== 'boolean') {
    return res.status(400).json({ success: false, message: "'attended' must be a boolean" });
  }

  const updatedSubject = await subjectService.markAttendance(subjectId, attended);
  res.status(200).json({ success: true, data: updatedSubject });
};

exports.getAnalytics = async (req, res) => {
  const { subjectId } = req.params;
  const subject = await subjectService.getSubjectById(subjectId);
  
  const analytics = intelligenceService.calculateAnalytics(subject);
  
  res.status(200).json(analytics); // Returning exact format requested
};