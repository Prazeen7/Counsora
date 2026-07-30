const Institution = require('../models/Institution');

const getInstitutions = async (req, res) => {
    try {
        const { search, location, page = 1, limit = 12 } = req.query;

        const query = {}

        if (search) {
            query.institutionName = { $regex: search, $options: "i" }
        }

        if (location && location !== "all") {
            query["campuses.city"] = location
        }

        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        const [institutions, total] = await Promise.all([
            Institution.find(query)
                .select("institutionName logo country type campuses.city entryRequirement intakes scholarship applicationFee ")
                .skip(skip)
                .limit(limitNumber)
                .sort({ institutionName: 1 }),

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
        console.error("Error fetching institutions:", error);

        return res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getInstitutions
}