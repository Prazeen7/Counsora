const graduateDiploma = /\b(?:post[ -]?graduate|graduate|pg)\s+diploma\b|\bpgdip/i;
const graduateCertificate = /\b(?:post[ -]?graduate|graduate|pg)\s+certificate\b|\bpgcert/i;

function classifyProgramLevel(name, level) {
    if (graduateDiploma.test(name || "")) return "PG Diploma";
    if (graduateCertificate.test(name || "")) return "PG Certificate";
    if (/\bcertificate\b/i.test(name || "")) return "UG Certificate";
    if (/^(?:post[ -]?graduate|graduate|pg)\s+diploma$/i.test(level || "")) return "PG Diploma";
    if (/^(?:post[ -]?graduate|graduate|pg)\s+certificate$/i.test(level || "")) return "PG Certificate";
    if (/^(?:ug\s+)?certificate$/i.test(level || "")) return "UG Certificate";
    return level;
}

module.exports = { classifyProgramLevel };
