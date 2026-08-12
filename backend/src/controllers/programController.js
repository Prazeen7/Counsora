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

const createProgram = async (req, res) => {
    try {
        const { institution, ...programData } = req.body;

        // Find or create the program document for this institution
        let programDoc = await Program.findOne({ institution });

        if (!programDoc) {
            programDoc = new Program({
                institution,
                programs: [programData],
            });
        } else {
            programDoc.programs.push(programData);
        }

        await programDoc.save();

        // Return the newly created program (last item in the array)
        const newProgram = programDoc.programs[programDoc.programs.length - 1];

        return res.status(201).json(newProgram);
    } catch (error) {
        console.error("Error creating program:", error);
        return res.status(500).json({ error: error.message });
    }
};

const updateProgram = async (req, res) => {
    try {
        const { programId } = req.params;
        const updateData = req.body;

        console.log('Updating program with ID:', programId);
        console.log('Update data:', updateData);

        // Find the document containing this program
        const programDoc = await Program.findOne({ "programs._id": programId });

        if (!programDoc) {
            console.log('Program document not found for ID:', programId);
            return res.status(404).json({ error: "Program not found" });
        }

        // Find and update the specific program
        const program = programDoc.programs.id(programId);
        if (!program) {
            console.log('Program not found in array for ID:', programId);
            return res.status(404).json({ error: "Program not found" });
        }

        // Update program fields
        Object.keys(updateData).forEach(key => {
            if (key !== '_id' && key !== 'institution') {
                program[key] = updateData[key];
            }
        });

        await programDoc.save();
        console.log('Program updated successfully:', program._id);

        return res.status(200).json(program);
    } catch (error) {
        console.error("Error updating program:", error);
        return res.status(500).json({ error: error.message });
    }
};

const deleteProgram = async (req, res) => {
    try {
        const { programId } = req.params;

        console.log('Deleting program with ID:', programId);

        // Find the document containing this program
        const programDoc = await Program.findOne({ "programs._id": programId });

        if (!programDoc) {
            console.log('Program document not found for ID:', programId);
            return res.status(404).json({ error: "Program not found" });
        }

        console.log('Found program document, removing program from array');

        // Remove the program from the array
        programDoc.programs.pull(programId);
        await programDoc.save();

        console.log('Program deleted successfully:', programId);

        return res.status(200).json({
            message: "Program deleted successfully",
            programId
        });
    } catch (error) {
        console.error("Error deleting program:", error);
        return res.status(500).json({ error: error.message });
    }
};

const getAllProgram = async (req, res) => {
    try {
        const docs = await Program.find({ crawlStatus: 'completed' })
            .populate({
                path: 'institution',
                select: 'name country logo campuses entryRequirements applicationFee documents',
                populate: {
                    path: 'country',
                    select: 'name code currency'
                }
            })
            .lean();

        const allPrograms = docs.flatMap(doc =>
            doc.programs
                .filter(program => program.isActive !== false)
                .map(program => ({
                    ...program,
                    institutionId: doc.institution._id,
                    institutionName: doc.institution.name,
                    institutionLogo: doc.institution.logo,
                    country: doc.institution.country,
                    institutionData: doc.institution
                }))
        );

        return res.status(200).json(allPrograms);

    } catch (err) {
        console.error('Error fetching programs: ', err);
        return res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getProgramsByInstitution,
    createProgram,
    updateProgram,
    deleteProgram,
    getAllProgram,
};