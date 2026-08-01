const Institution = require('../models/Institution');
const Country = require('../models/Country');
const Program = require('../models/Program');
const mongoose = require("mongoose");

// Get all institutions
const getInstitutions = async (req, res) => {
    try {
        const { search, location, country, page = 1, limit = 12 } = req.body;

        const query = {};

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        if (location && location !== 'all') {
            query['campuses.city'] = location;
        }

        if (country && country !== 'all') {
            query.country = country;
        }

        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        const [institutions, total] = await Promise.all([
            Institution.find(query)
                .populate('country', 'code name currency')
                .select(
                    'name logo country type campuses.city entryRequirements intakes scholarships applicationFee'
                )
                .skip(skip)
                .limit(limitNumber)
                .sort({ name: 1 }),

            Institution.countDocuments(query),
        ]);

        return res.status(200).json({
            institutions,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                totalPages: Math.ceil(total / limitNumber),
            },
        });

    } catch (error) {
        console.error('Error fetching institutions:', error);
        return res.status(500).json({ error: error.message });
    }
};

// Get institution by ID
const getInstitutionById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid institution ID" });
        }

        const institution = await Institution.findById(id).populate(
            "country",
            "code name currency"
        );

        if (!institution) {
            return res.status(404).json({ error: "Institution not found" });
        }

        return res.status(200).json(institution);

    } catch (error) {
        console.error("Error fetching institution:", error);
        return res.status(500).json({ error: error.message });
    }
};

// add institution with programs
const addInstitution = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            programs = [],
            ...institutionData
        } = req.body;

        // Validate required fields
        if (!institutionData.name || !institutionData.country) {
            return res.status(400).json({
                error: 'Institution name and country are required',
            });
        }

        // Validate country
        const country = await Country.findById(institutionData.country).session(session);
        if (!country) {
            return res.status(404).json({
                error: 'Country not found',
            });
        }

        // 1. Create institution
        const institution = await Institution.create(
            [institutionData],
            { session }
        );

        const createdInstitution = institution[0];

        // 2. Create program document linked to institution
        await Program.create(
            [{
                institution: createdInstitution._id,
                programs,
            }],
            { session }
        );

        await session.commitTransaction();

        const populatedInstitution = await Institution.findById(createdInstitution._id)
            .populate('country', 'code name currency');

        return res.status(201).json({
            message: 'Institution and programs created successfully',
            institution: populatedInstitution,
            programCount: programs.length,
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error creating institution:', error);

        return res.status(500).json({
            error: error.message,
        });
    } finally {
        session.endSession();
    }
};

module.exports = {
    getInstitutions,
    getInstitutionById,
    addInstitution,
};
