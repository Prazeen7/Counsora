const undergraduateLevels = ["Bachelor", "UG Certificate", "Certificate", "Diploma", "Foundation", "Undergraduate"];
const postgraduateLevels = ["PG Diploma", "PG Certificate", "Master", "PhD", "Doctoral", "Research", "Postgraduate"];

module.exports = function programAcademicLevelFilter(qualification) {
    if (qualification === undefined || qualification === "") return null;
    if (typeof qualification !== "string" || !["high_school", "bachelors", "masters", "phd"].includes(qualification)) {
        throw new Error("Select a valid completed qualification");
    }
    const undergraduate = qualification === "high_school";
    // Preserve the existing eligibility grouping, with degree-name fallback for legacy records.
    const fallback = {
        level: { $nin: [...undergraduateLevels, ...postgraduateLevels] },
        degree_name: { $regex: undergraduate ? "bachelor|undergraduate" : "master|phd|postgraduate|doctorate", $options: "i" },
    };
    if (!undergraduate) {
        fallback.$nor = [{ degree_name: { $regex: "bachelor|undergraduate", $options: "i" } }];
    }
    const postgraduateCertificate = {
        level: "Certificate",
        degree_name: { $regex: "postgraduate|post[ -]graduate|graduate certificate|pgcert", $options: "i" },
    };
    const explicitLevel = { level: { $in: undergraduate ? undergraduateLevels : postgraduateLevels } };
    if (undergraduate) explicitLevel.$nor = [postgraduateCertificate];
    return { $or: undergraduate
        ? [explicitLevel, fallback]
        : [explicitLevel, postgraduateCertificate, fallback] };
};
