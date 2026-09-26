// Proportional estimate used for program discovery, not credential equivalency.
module.exports = function applicantAcademicScore(query) {
    const parse = (key, max) => {
        const value = query[key];
        if (value === undefined) return null;
        if (typeof value !== 'string' || !value.trim() || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > max) {
            throw new Error(`${key === 'gpa' ? 'GPA' : 'Percentage'} must be a number between 0 and ${max}`);
        }
        return Number(value);
    };
    const gpa = parse('gpa', 4);
    const percentage = parse('percentage', 100);
    if (percentage !== null && gpa !== null && gpa > 0) {
        throw new Error('Provide either GPA or percentage, not both');
    }
    // Preserve the existing GPA=0 convention for an inactive filter.
    return percentage !== null ? percentage / 25 : gpa > 0 ? gpa : null;
};
