const Institution = require('../models/Institution');
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

module.exports = {
    getInstitutions,
    getInstitutionById,
};
