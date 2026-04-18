class IntelligenceService {
  /**
   * BONUS UTILITY: Simulate attendance over next N classes
   */
  simulateAttendance(attended, total, nextNClasses, classesToMiss) {
    if (total + nextNClasses === 0) return 100;
    const classesToAttend = nextNClasses - classesToMiss;
    return ((attended + classesToAttend) / (total + nextNClasses)) * 100;
  }

  calculateAnalytics(subject) {
    const { name, totalClasses, attendedClasses } = subject;
    
    // A. Attendance Calculation
    const currentAttendance = totalClasses === 0 
      ? 100 
      : (attendedClasses / totalClasses) * 100;

    // B. Safe Bunk Calculation
    let safeBunks = 0;
    let simulatedTotal = totalClasses;
    while (true) {
      simulatedTotal++;
      const simulatedPercent = (attendedClasses / simulatedTotal) * 100;
      if (simulatedPercent >= 75) {
        safeBunks++;
      } else {
        break;
      }
    }

    // C. Prediction Engine
    // ifAttendAll translates to attending the next immediate class consistently
    const ifAttendAll = this.simulateAttendance(attendedClasses, totalClasses, 1, 0);
    const ifMissNext = this.simulateAttendance(attendedClasses, totalClasses, 1, 1);

    // D. Risk Level
    let riskLevel = 'LOW';
    if (currentAttendance < 75) riskLevel = 'HIGH';
    else if (currentAttendance <= 80) riskLevel = 'MEDIUM';

    // Calculation for Deficit (if < 75%)
    let neededClasses = 0;
    let tempAttended = attendedClasses;
    let tempTotal = totalClasses;
    while (tempTotal === 0 || (tempAttended / tempTotal) * 100 < 75) {
      tempAttended++;
      tempTotal++;
      neededClasses++;
    }

    // E. Recommendation Engine
    let recommendation = '';
    if (riskLevel === 'HIGH') {
      recommendation = `Your attendance is critical. You must attend the next ${neededClasses} classes consecutively to reach 75%.`;
    } else if (safeBunks === 0 && currentAttendance >= 75) {
      recommendation = 'You are exactly at the threshold. Do NOT skip the next class!';
    } else {
      recommendation = `You are doing great. You can safely skip ${safeBunks} class${safeBunks > 1 ? 'es' : ''} without dropping below 75%.`;
    }

    return {
      subject: name,
      currentAttendance: parseFloat(currentAttendance.toFixed(2)),
      classesAttended: attendedClasses,
      totalClasses: totalClasses,
      safeBunks,
      riskLevel,
      prediction: {
        ifAttendAll: parseFloat(ifAttendAll.toFixed(2)),
        ifMissNext: parseFloat(ifMissNext.toFixed(2)),
      },
      recommendation,
    };
  }
}

module.exports = new IntelligenceService();