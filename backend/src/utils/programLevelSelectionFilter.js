const options = require("../../../shared/programLevelOptions.json");

module.exports = function programLevelSelectionFilter({ academicLevel, levels }) {
    if (academicLevel !== undefined && academicLevel !== "" && !Object.hasOwn(options, academicLevel)) {
        throw new Error("Select a valid completed qualification");
    }
    const allowed = options[academicLevel];
    if (levels === undefined || levels === "") {
        return allowed ? { level: { $in: allowed } } : null;
    }
    if (!allowed || typeof levels !== "string") throw new Error("Select a qualification before choosing program levels");
    const selected = [...new Set(levels.split(","))];
    if (selected.some(level => !allowed.includes(level))) throw new Error("Select program levels available for the completed qualification");
    return { level: { $in: selected } };
};
