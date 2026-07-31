const Program = require("../models/Program");

const getProgramsByInstitution = async (req, res) => {
    try {
        const { institutionId } = req.params;

        const programDoc = await Program.findOne({ institution: institutionId });

        // we are leaving this 200 for now, we will change it later after db is poppulated.
        if (!programDoc) {
            return res.status(200).json({
                count: 0,
                programs: [],
            });
        }

        return res.status(200).json({
            count: programDoc.programs.length,
            programs: programDoc.programs,
        });
    } catch (error) {
        console.error("Error fetching programs:", error);
        return res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getProgramsByInstitution,
};