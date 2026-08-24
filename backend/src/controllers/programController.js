const Program = require("../models/Program");
const mongoose = require("mongoose");


// Get all programs for an institution
const getProgramsByInstitution = async (req, res) => {
    try {
        const { institutionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(institutionId)) {
            return res.status(400).json({
                error: "Invalid institution ID",
            });
        }

        const programs = await Program.find({
            institutionId,
            isActive: true,
        }).lean();

        return res.status(200).json({
            count: programs.length,
            programs,
        });

    } catch (error) {
        console.error("Error fetching programs:", error);

        return res.status(500).json({
            error: error.message,
        });
    }
};


// Create one program
const createProgram = async (req, res) => {
    try {
        const { institutionId, ...programData } = req.body;

        if (!institutionId) {
            return res.status(400).json({
                error: "institutionId is required",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(institutionId)) {
            return res.status(400).json({
                error: "Invalid institutionId",
            });
        }

        const program = await Program.create({
            institutionId,
            ...programData,
        });

        return res.status(201).json(program);

    } catch (error) {
        console.error("Error creating program:", error);

        return res.status(500).json({
            error: error.message,
        });
    }
};


// Update one program
const updateProgram = async (req, res) => {
    try {
        const { programId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(programId)) {
            return res.status(400).json({
                error: "Invalid program ID",
            });
        }

        const updateData = { ...req.body };

        // Don't allow changing these through normal update
        delete updateData._id;
        delete updateData.institutionId;

        const program = await Program.findByIdAndUpdate(
            programId,
            updateData,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!program) {
            return res.status(404).json({
                error: "Program not found",
            });
        }

        return res.status(200).json(program);

    } catch (error) {
        console.error("Error updating program:", error);

        return res.status(500).json({
            error: error.message,
        });
    }
};


// Delete one program
const deleteProgram = async (req, res) => {
    try {
        const { programId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(programId)) {
            return res.status(400).json({
                error: "Invalid program ID",
            });
        }

        const program = await Program.findByIdAndDelete(programId);

        if (!program) {
            return res.status(404).json({
                error: "Program not found",
            });
        }

        return res.status(200).json({
            message: "Program deleted successfully",
            programId,
        });

    } catch (error) {
        console.error("Error deleting program:", error);

        return res.status(500).json({
            error: error.message,
        });
    }
};


// Get all programs
const getAllProgram = async (req, res) => {
    try {
        const programs = await Program.find({
            isActive: true,
        })
            .populate({
                path: "institutionId",
                select: "name country logo campuses entryRequirements applicationFee documents",
                populate: {
                    path: "country",
                    select: "name code currency",
                },
            })
            .lean();

        const allPrograms = programs.map((program) => ({
            ...program,
            institution: program.institutionId,
            institutionId: program.institutionId?._id,
            institutionName: program.institutionId?.name,
            institutionLogo: program.institutionId?.logo,
            country: program.institutionId?.country,
            institutionData: program.institutionId,
        }));

        return res.status(200).json(allPrograms);

    } catch (error) {
        console.error("Error fetching programs:", error);

        return res.status(500).json({
            error: error.message,
        });
    }
};


module.exports = {
    getProgramsByInstitution,
    createProgram,
    updateProgram,
    deleteProgram,
    getAllProgram,
};