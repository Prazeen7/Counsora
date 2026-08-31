const Institution = require('../models/Institution');
const Country = require('../models/Country');
const Program = require('../models/Program');
const mongoose = require("mongoose");
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { normalizeProgramsArray } = require('../utils/normalizeProgramData');

const CRAWLER_API_URL = process.env.CRAWLER_API_URL || 'http://localhost:3000';

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
            Institution.aggregate([
                { $match: query },

                {
                    $lookup: {
                        from: "programs",
                        let: { institutionId: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                $eq: [
                                                    "$institutionId",
                                                    "$$institutionId",
                                                ],
                                            },
                                            {
                                                $eq: ["$isActive", true],
                                            },
                                        ],
                                    },
                                },
                            },
                            {
                                $count: "count",
                            },
                        ],
                        as: "programStats",
                    },
                },

                {
                    $addFields: {
                        programCount: {
                            $ifNull: [
                                { $arrayElemAt: ["$programStats.count", 0] },
                                0,
                            ],
                        },
                    },
                },

                {
                    $project: {
                        name: 1,
                        logo: 1,
                        country: 1,
                        type: 1,
                        "campuses.city": 1,
                        entryRequirements: 1,
                        scholarships: 1,
                        applicationFee: 1,
                        programCount: 1,
                    },
                },

                { $sort: { name: 1 } },
                { $skip: skip },
                { $limit: limitNumber },

                {
                    $lookup: {
                        from: "countries",
                        localField: "country",
                        foreignField: "_id",
                        as: "country",
                    },
                },

                {
                    $unwind: {
                        path: "$country",
                        preserveNullAndEmptyArrays: true,
                    },
                },

                {
                    $project: {
                        name: 1,
                        logo: 1,
                        type: 1,
                        campuses: 1,
                        entryRequirements: 1,
                        scholarships: 1,
                        applicationFee: 1,
                        programCount: 1,
                        country: {
                            _id: "$country._id",
                            code: "$country.code",
                            name: "$country.name",
                            currency: "$country.currency",
                        },
                    },
                },
            ]),

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
        // Parse JSON fields from FormData
        const institutionData = {};

        for (const [key, value] of Object.entries(req.body)) {
            try {
                // Try to parse as JSON
                institutionData[key] = JSON.parse(value);
            } catch {
                // If not JSON, use as-is
                institutionData[key] = value;
            }
        }

        const { programs = [], ...restInstitutionData } = institutionData;

        // Validate required fields
        if (!restInstitutionData.name || !restInstitutionData.country) {
            return res.status(400).json({
                error: 'Institution name and country are required',
            });
        }

        // Validate country
        const country = await Country.findById(restInstitutionData.country).session(session);
        if (!country) {
            return res.status(404).json({
                error: 'Country not found',
            });
        }

        // Handle logo upload if file is provided
        if (req.file) {
            try {
                console.log('Uploading file to Cloudinary...');
                console.log('File size:', req.file.size);
                console.log('File mimetype:', req.file.mimetype);

                // Convert buffer to stream and upload
                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            folder: 'institutions',
                            resource_type: 'image',
                        },
                        (error, result) => {
                            if (error) {
                                console.error('Cloudinary upload error:', error);
                                reject(error);
                            } else {
                                console.log('Cloudinary upload success:', result.secure_url);
                                resolve(result);
                            }
                        }
                    );
                    streamifier.createReadStream(req.file.buffer).pipe(stream);
                });

                restInstitutionData.logo = {
                    url: result.secure_url,
                    publicId: result.public_id,
                };
            } catch (uploadError) {
                await session.abortTransaction();
                console.error('Full upload error:', uploadError);
                return res.status(500).json({
                    error: 'Failed to upload logo: ' + uploadError.message,
                });
            }
        }

        // 1. Create institution
        const institution = await Institution.create(
            [restInstitutionData],
            { session }
        );

        const createdInstitution = institution[0];

        // 2. Create program document linked to institution
        // 2. Create one Program document per program
        if (programs && programs.length > 0) {
            const programDocuments = programs.map((program) => ({
                ...program,
                institutionId: createdInstitution._id,
            }));

            await Program.insertMany(programDocuments, { session });
        }

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

// Crawl and add programs for an institution
const crawlAndAddPrograms = async (req, res) => {
    try {
        const { institutionId } = req.params;
        const { websiteUrl } = req.body;

        console.log(`\n=== Crawl Request Received ===`);
        console.log(`Institution ID: ${institutionId}`);
        console.log(`Website URL: ${websiteUrl}`);

        if (!websiteUrl) {
            return res.status(400).json({
                error: 'Website URL is required',
            });
        }

        // Validate institution
        if (!mongoose.Types.ObjectId.isValid(institutionId)) {
            return res.status(400).json({ error: 'Invalid institution ID' });
        }

        const institution = await Institution.findById(institutionId);
        if (!institution) {
            return res.status(404).json({ error: 'Institution not found' });
        }

        console.log(`✓ Institution found: ${institution.name}`);

        // Check crawl status
        const existingProgramCount = await Program.countDocuments({
            institutionId,
            isActive: true,
        });

        if (institution.crawlStatus === "completed") {
            console.log(
                `✓ Programs already approved (${existingProgramCount} programs)`
            );

            return res.status(200).json({
                message: "Programs already exist and are approved for this institution",
                shouldCrawl: false,
                programCount: existingProgramCount,
                lastCrawled: institution.lastCrawled,
                crawlStatus: institution.crawlStatus,
            });
        }

        if (institution.crawlStatus === "pending_review") {
            console.log("✓ Programs awaiting review");

            const tempFilePath = path.join(
                __dirname,
                "../../temp-crawls",
                `${institutionId}.json`
            );

            let programCount = 0;

            if (fs.existsSync(tempFilePath)) {
                const tempData = JSON.parse(
                    fs.readFileSync(tempFilePath, "utf8")
                );

                programCount = tempData.length;
            }

            return res.status(200).json({
                message: "Programs are pending review",
                shouldCrawl: false,
                programCount,
                lastCrawled: institution.lastCrawled,
                crawlStatus: institution.crawlStatus,
            });
        }

        console.log(`No existing approved programs found, starting crawl...`);
        // Update institution crawl status
        institution.crawlStatus = "in_progress";
        await institution.save();

        console.log(`✓ Crawl status set to 'in_progress'`);

        // Send immediate response that crawl is starting
        res.status(202).json({
            message: 'Crawling started. This may take several minutes.',
            institutionId,
            websiteUrl,
            status: 'in_progress',
        });

        console.log(`✓ Response sent to client, starting background crawl...`);

        // Start crawler in background (non-blocking)
        crawlInBackground(institutionId, websiteUrl);

    } catch (error) {
        console.error('Error initiating crawl:', error);
        return res.status(500).json({
            error: error.message,
        });
    }
};

// Background crawler function
const crawlInBackground = async (institutionId, websiteUrl) => {
    try {
        console.log(`\n=== Starting background crawl ===`);
        console.log(`Institution ID: ${institutionId}`);
        console.log(`Website URL: ${websiteUrl}`);
        console.log(`Crawler API URL: ${CRAWLER_API_URL}/crawl`);

        // Call crawler API using axios
        console.log(`Calling crawler API...`);
        const crawlerResponse = await axios.post(`${CRAWLER_API_URL}/crawl`, {
            url: websiteUrl
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`Crawler API response status: ${crawlerResponse.status}`);
        console.log(`Crawler API success: ${crawlerResponse.data.success}`);
        console.log(`Programs found: ${crawlerResponse.data.data?.length || 0}`);

        if (crawlerResponse.data.success && crawlerResponse.data.data) {
            const crawledPrograms = crawlerResponse.data.data;

            // Normalize program data to ensure consistent schema
            console.log(`Normalizing ${crawledPrograms.length} programs...`);
            const { normalized, errors } = normalizeProgramsArray(crawledPrograms);

            if (errors.length > 0) {
                console.warn(`⚠️  ${errors.length} programs failed normalization:`);
                errors.forEach(err => {
                    console.warn(`  - Index ${err.index} (${err.program}): ${err.error}`);
                });
            }

            console.log(`✓ Successfully normalized ${normalized.length} programs`);

            // Store temporarily in file system, NOT in database
            const tempDir = path.join(__dirname, '../../temp-crawls');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
                console.log(`✓ Created temp directory: ${tempDir}`);
            }

            const tempFilePath = path.join(tempDir, `${institutionId}.json`);
            fs.writeFileSync(tempFilePath, JSON.stringify(normalized, null, 2));

            console.log(`✓ Stored ${normalized.length} programs in temp file: ${tempFilePath}`);
            console.log(`⚠️  IMPORTANT: Programs are NOT in database yet - awaiting user review`);

            // Update status to pending_review without saving programs to DB
            const institution = await Institution.findById(institutionId);

            if (!institution) {
                throw new Error("Institution not found");
            }

            institution.crawlStatus = "pending_review";
            institution.lastCrawled = new Date();

            await institution.save();

            console.log(`✓ Institution status updated to pending_review`);

            console.log(`✅ Crawl completed - ${normalized.length} programs ready for review (not saved to DB yet)`);
            console.log(`✅ Status set to: pending_review`);

            if (errors.length > 0) {
                console.log(`⚠️  ${errors.length} programs were skipped due to validation errors`);
            }
        } else {
            throw new Error('Crawler returned no data');
        }

    } catch (error) {
        console.error(`\n❌ Background crawl failed for institution ${institutionId}:`);
        console.error(`Error: ${error.message}`);

        // More detailed error logging
        if (error.response) {
            console.error(`Response status: ${error.response.status}`);
            console.error(`Response data:`, error.response.data);
        } else if (error.request) {
            console.error(`No response received from crawler`);
        } else {
            console.error(`Error setting up request:`, error.message);
        }

        console.error(`Stack: ${error.stack}`);

        // Update status to failed
        try {
            const institution = await Institution.findById(institutionId);

            if (institution) {
                institution.crawlStatus = "failed";
                await institution.save();

                console.log(`Updated institution status to 'failed'`);
            }
        } catch (dbError) {
            console.error(`Failed to update status in DB: ${dbError.message}`);
        }
    }
};

// Get crawl status for an institution
const getCrawlStatus = async (req, res) => {
    try {
        const { institutionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(institutionId)) {
            return res.status(400).json({ error: 'Invalid institution ID' });
        }

        const institution = await Institution.findById(institutionId);

        if (!institution) {
            return res.status(404).json({
                error: "Institution not found",
            });
        }

        const approvedProgramCount = await Program.countDocuments({
            institutionId,
            isActive: true,
        });

        console.log(`\n=== Get Crawl Status for ${institutionId} ===`);
        console.log(`DB Status: ${institution.crawlStatus}`);
        console.log(`DB Approved Program Count: ${approvedProgramCount}`);

        // If status is pending_review, get count from temp file
        let programCount = approvedProgramCount;

        if (institution.crawlStatus === "pending_review") {
            const tempFilePath = path.join(
                __dirname,
                "../../temp-crawls",
                `${institutionId}.json`
            );

            if (fs.existsSync(tempFilePath)) {
                try {
                    const tempData = JSON.parse(
                        fs.readFileSync(tempFilePath, "utf8")
                    );

                    programCount = tempData.length;
                } catch (err) {
                    console.error(
                        "Error reading temp file:",
                        err
                    );
                }
            }
        }

        console.log(
            `Returning status: ${institution.crawlStatus}, count: ${programCount}`
        );

        return res.status(200).json({
            status: institution.crawlStatus,
            programCount,
            lastCrawled: institution.lastCrawled,
            updatedAt: institution.updatedAt,
        });

    } catch (error) {
        console.error('Error fetching crawl status:', error);
        return res.status(500).json({ error: error.message });
    }
};

// Get pending programs for review
const getPendingPrograms = async (req, res) => {
    try {
        const { institutionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(institutionId)) {
            return res.status(400).json({ error: 'Invalid institution ID' });
        }

        const institution = await Institution.findById(institutionId);

        if (!institution) {
            return res.status(404).json({
                error: "Institution not found",
            });
        }

        if (institution.crawlStatus !== "pending_review") {
            return res.status(400).json({
                error: "Programs are not in pending review status",
                currentStatus: institution.crawlStatus,
            });
        }

        // Read programs from temp file
        const tempFilePath = path.join(__dirname, '../../temp-crawls', `${institutionId}.json`);

        if (!fs.existsSync(tempFilePath)) {
            return res.status(404).json({ error: 'Temp program data not found' });
        }

        const programs = JSON.parse(fs.readFileSync(tempFilePath, 'utf8'));

        return res.status(200).json({
            programs,
            crawlStatus: institution.crawlStatus,
            lastCrawled: institution.lastCrawled,
            totalCount: programs.length
        });

    } catch (error) {
        console.error('Error fetching pending programs:', error);
        return res.status(500).json({ error: error.message });
    }
};

// Update and approve programs after review
const approvePrograms = async (req, res) => {
    try {
        const { institutionId } = req.params;
        const { programs } = req.body;

        if (!mongoose.Types.ObjectId.isValid(institutionId)) {
            return res.status(400).json({ error: 'Invalid institution ID' });
        }

        if (!Array.isArray(programs)) {
            return res.status(400).json({ error: 'Programs must be an array' });
        }

        console.log(`\n=== Approving programs for institution ${institutionId} ===`);
        console.log(`Received ${programs.length} programs for approval`);

        // Normalize the edited programs
        const { normalized, errors } = normalizeProgramsArray(programs);

        if (errors.length > 0) {
            console.warn(`⚠️  ${errors.length} programs failed validation during approval`);
        }

        // Remove existing programs for this institution
        await Program.deleteMany({
            institutionId,
        });

        // Create one document for each approved program
        const programDocuments = normalized.map((program) => ({
            ...program,
            institutionId,
        }));

        if (programDocuments.length > 0) {
            await Program.insertMany(programDocuments);
        }

        // Update institution status
        await Institution.findByIdAndUpdate(
            institutionId,
            {
                crawlStatus: "completed",
                lastCrawled: new Date(),
            }
        );

        console.log(`✅ Approved and saved ${normalized.length} programs to database`);

        // Delete temp file after successful approval
        const tempFilePath = path.join(__dirname, '../../temp-crawls', `${institutionId}.json`);

        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
            console.log(`✓ Deleted temp file: ${tempFilePath}`);
        }

        return res.status(200).json({
            message: 'Programs approved successfully',
            approvedCount: normalized.length,
            skippedCount: errors.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Error approving programs:', error);
        return res.status(500).json({ error: error.message });
    }
};

// Reject/cancel crawl
const rejectCrawl = async (req, res) => {
    try {
        const { institutionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(institutionId)) {
            return res.status(400).json({ error: 'Invalid institution ID' });
        }

        const institution = await Institution.findById(institutionId);

        if (!institution) {
            return res.status(404).json({
                error: "Institution not found",
            });
        }

        // Clear programs and reset status
        institution.crawlStatus = "pending";
        await institution.save();

        console.log(`❌ Crawl rejected for institution ${institutionId}`);

        // Delete temp file if it exists
        const tempFilePath = path.join(__dirname, '../../temp-crawls', `${institutionId}.json`);

        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
            console.log(`✓ Deleted temp file: ${tempFilePath}`);
        }

        return res.status(200).json({
            message: 'Crawl rejected successfully'
        });

    } catch (error) {
        console.error('Error rejecting crawl:', error);
        return res.status(500).json({ error: error.message });
    }
};

// Update institution
const updateInstitution = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid institution ID" });
        }

        // Parse JSON fields from FormData
        const updateData = {};

        for (const [key, value] of Object.entries(req.body)) {
            // FormData stringifies JavaScript undefined. Never pass that
            // sentinel into Mongoose, especially for embedded documents.
            if (value === undefined || value === "undefined") {
                continue;
            }
            try {
                // Try to parse as JSON
                const parsed = JSON.parse(value);
                if (parsed !== undefined) updateData[key] = parsed;
            } catch {
                // If not JSON, use as-is
                updateData[key] = value;
            }
        }

        // Normalize legacy embedded records before running update validators.
        // Older campuses may predate the required address field, and edit-mode
        // client identifiers must never be persisted.
        if (Array.isArray(updateData.campuses)) {
            updateData.campuses = updateData.campuses
                .filter((campus) => campus && typeof campus === "object" && !campus.markedForDeletion)
                .map(({ _clientId, markedForDeletion, country, ...campus }) => ({
                    ...campus,
                    address: String(campus.address || campus.city || campus.name || country || "").trim(),
                }))
                .filter((campus) => campus.address);
        }

        if (Array.isArray(updateData.scholarships)) {
            updateData.scholarships = updateData.scholarships
                .filter((scholarship) => scholarship && typeof scholarship === "object" && !scholarship.markedForDeletion)
                .map(({ _clientId, markedForDeletion, ...scholarship }) => scholarship);
        }

        // Handle logo upload if file is provided
        if (req.file) {
            try {
                console.log('Uploading new logo to Cloudinary...');

                // Convert buffer to stream and upload
                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            folder: 'institutions',
                            resource_type: 'image',
                        },
                        (error, result) => {
                            if (error) {
                                console.error('Cloudinary upload error:', error);
                                reject(error);
                            } else {
                                console.log('Cloudinary upload success:', result.secure_url);
                                resolve(result);
                            }
                        }
                    );
                    streamifier.createReadStream(req.file.buffer).pipe(stream);
                });

                updateData.logo = {
                    url: result.secure_url,
                    publicId: result.public_id,
                };
            } catch (uploadError) {
                console.error('Upload error:', uploadError);
                return res.status(500).json({
                    error: 'Failed to upload logo: ' + uploadError.message,
                });
            }
        }

        // Update institution
        const institution = await Institution.findByIdAndUpdate(
            id,
            updateData,
            { returnDocument: "after", runValidators: true }
        ).populate("country", "code name currency");

        if (!institution) {
            return res.status(404).json({ error: "Institution not found" });
        }

        console.log(`✓ Institution updated: ${institution.name}`);

        return res.status(200).json(institution);

    } catch (error) {
        console.error("Error updating institution:", error);
        return res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getInstitutions,
    getInstitutionById,
    addInstitution,
    updateInstitution,
    crawlAndAddPrograms,
    getCrawlStatus,
    getPendingPrograms,
    approvePrograms,
    rejectCrawl,
};
