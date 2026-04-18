const Subject = require('../models/Subject');

class SubjectService {
  async createSubject(name) {
    if (!name) throw { statusCode: 400, message: 'Subject name is required' };
    const subject = await Subject.create({ name });
    return subject;
  }

  async markAttendance(subjectId, attended) {
    const subject = await Subject.findById(subjectId);
    if (!subject) throw { statusCode: 404, message: 'Subject not found' };

    subject.totalClasses += 1;
    if (attended) {
      subject.attendedClasses += 1;
    }

    await subject.save();
    return subject;
  }

  async getSubjectById(subjectId) {
    const subject = await Subject.findById(subjectId);
    if (!subject) throw { statusCode: 404, message: 'Subject not found' };
    return subject;
  }
}

module.exports = new SubjectService();