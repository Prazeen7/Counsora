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
const { readCompletedCrawl } = require('../utils/savedCrawl');

const CRAWLER_API_URL = process.env.CRAWLER_API_URL || 'http://localhost:3000';
const activeCrawls = new Set();

const programIdentity = (program) => String(program?.degree_name || program?.name || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const keepMissingPrograms = (candidates, existingPrograms) => {
    const known = new Set(existingPrograms.map(programIdentity).filter(Boolean));
    return candidates.filter((program) => {
        const identity = programIdentity(program);
        if (!identity || known.has(identity)) return false;
        known.add(identity);
        return true;
    });
};

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
            if (!mongoose.Types.ObjectId.isValid(country)) {
                return res.status(400).json({ error: 'Invalid country' });
            }
            query.country = new mongoose.Types.ObjectId(country);
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
        const { websiteUrl, importMissingOnly = false, availableOnly = false } = req.body;

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

        // Individual local results are importable even if the final crawl checkpoint is missing.
        const saved = availableOnly ? readCompletedCrawl(
            process.env.CRAWL_OUTPUT_DIR || path.join(__dirname, '../../../counsora-crawler/crawl-output'),
            websiteUrl,
            { includePartial: true }
        ) : null;
        if (saved) {
            const { normalized } = normalizeProgramsArray(saved);
            if (!normalized.length) throw new Error('Saved crawl contains no valid programs to review');
            const existingPrograms = importMissingOnly
                ? await Program.find({ institutionId }).select('degree_name').lean()
                : [];
            const pending = importMissingOnly ? keepMissingPrograms(normalized, existingPrograms) : normalized;
            if (pending.length) {
                const tempDir = path.join(__dirname, '../../temp-crawls');
                fs.mkdirSync(tempDir, { recursive: true });
                fs.writeFileSync(path.join(tempDir, `${institutionId}.json`), JSON.stringify(pending, null, 2));
            } else {
                const tempFilePath = path.join(__dirname, '../../temp-crawls', `${institutionId}.json`);
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            }
            institution.crawlStatus = pending.length ? 'pending_review' : 'completed';
            institution.lastCrawled = new Date();
            await institution.save();
            return res.status(200).json({
                message: pending.length ? 'Saved programs are ready for review' : 'No missing programs found',
                shouldCrawl: false,
                programCount: pending.length,
                crawlStatus: institution.crawlStatus,
            });
        }

        if (availableOnly) {
            return res.status(200).json({
                message: 'No local structured program files are available to import',
                shouldCrawl: false,
                programCount: 0,
                crawlStatus: 'completed',
            });
        }

        if (activeCrawls.has(institutionId)) {
            return res.status(200).json({
                message: "A program crawl is already in progress",
                shouldCrawl: false,
                programCount: 0,
                crawlStatus: institution.crawlStatus,
            });
        }

        console.log(`Checking and completing missing program extraction steps...`);
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
        activeCrawls.add(institutionId);
        crawlInBackground(institutionId, websiteUrl, { importMissingOnly })
            .finally(() => activeCrawls.delete(institutionId));

    } catch (error) {
        console.error('Error initiating crawl:', error);
        return res.status(500).json({
            error: error.message,
        });
    }
};

// Background crawler function
const crawlInBackground = async (institutionId, websiteUrl, { importMissingOnly = false } = {}) => {
    try {
        console.log(`\n=== Starting background crawl ===`);
        console.log(`Institution ID: ${institutionId}`);
        console.log(`Website URL: ${websiteUrl}`);
        console.log(`Crawler API URL: ${CRAWLER_API_URL}/crawl`);

        // Call crawler API using axios
        console.log(`Calling crawler API...`);
        const crawlInstitution = await Institution.findById(institutionId).populate('country', 'name');
        if (!crawlInstitution?.country?.name) throw new Error('Institution must have a valid country before crawling');
        const crawlerResponse = await axios.post(`${CRAWLER_API_URL}/crawl`, {
            countryName: crawlInstitution.country.name,
            checkStructuredData: true,
            url: websiteUrl
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`Crawler API response status: ${crawlerResponse.status}`);
        console.log(`Crawler API success: ${crawlerResponse.data.success}`);
        console.log(`Programs found: ${crawlerResponse.data.data?.length || 0}`);

        if (crawlerResponse.data.complete === false ||
            crawlerResponse.data.steps?.some((step) => ['incomplete', 'failed'].includes(step.status))) {
            throw new Error('Crawler still has programs missing structured data; finish extraction before review');
        }

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

            const existingPrograms = importMissingOnly
                ? await Program.find({ institutionId }).select("degree_name").lean()
                : [];
            const programsForReview = importMissingOnly
                ? keepMissingPrograms(normalized, existingPrograms)
                : normalized;

            if (importMissingOnly) {
                console.log(`✓ Kept ${programsForReview.length} programs missing from the database`);
            }

            if (programsForReview.length === 0) {
                const staleTempFile = path.join(__dirname, '../../temp-crawls', `${institutionId}.json`);
                if (fs.existsSync(staleTempFile)) fs.unlinkSync(staleTempFile);
                await Institution.findByIdAndUpdate(institutionId, {
                    crawlStatus: "completed",
                    lastCrawled: new Date(),
                });
                console.log("✓ No missing programs found; nothing was queued for review");
                return;
            }

            // Store temporarily in file system, NOT in database
            const tempDir = path.join(__dirname, '../../temp-crawls');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
                console.log(`✓ Created temp directory: ${tempDir}`);
            }

            const tempFilePath = path.join(tempDir, `${institutionId}.json`);
            fs.writeFileSync(tempFilePath, JSON.stringify(programsForReview, null, 2));

            console.log(`✓ Stored ${programsForReview.length} programs in temp file: ${tempFilePath}`);
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

            console.log(`✅ Crawl completed - ${programsForReview.length} programs ready for review (not saved to DB yet)`);
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

        const tempFilePath = path.join(__dirname, '../../temp-crawls', institutionId + '.json');
        let programCount = 0;
        if (institution.crawlStatus === 'pending_review' && fs.existsSync(tempFilePath)) {
            const pending = JSON.parse(fs.readFileSync(tempFilePath, 'utf8'));
            programCount = Array.isArray(pending) ? pending.length : 0;
        } else if (req.query?.availableOnly === 'true' && institution.crawlStatus !== 'completed') {
            const saved = readCompletedCrawl(
                process.env.CRAWL_OUTPUT_DIR || path.join(__dirname, '../../../counsora-crawler/crawl-output'),
                institution.website,
                { includePartial: true }
            );
            if (saved) {
                const { normalized } = normalizeProgramsArray(saved);
                programCount = normalized.length;
                if (programCount) {
                    fs.mkdirSync(path.dirname(tempFilePath), { recursive: true });
                    fs.writeFileSync(tempFilePath, JSON.stringify(normalized, null, 2));
                }
            }
        }
        if (programCount && institution.crawlStatus !== 'pending_review') {
            institution.crawlStatus = 'pending_review';
            await institution.save();
        }
        console.log('Local import status:', institution.crawlStatus, 'program count:', programCount);

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

        // Preserve existing records and append only genuinely missing programs.
        // Recheck here because the database may have changed while review was open.
        const existingPrograms = await Program.find({ institutionId }).select("degree_name").lean();
        const missingPrograms = keepMissingPrograms(normalized, existingPrograms);
        const programDocuments = missingPrograms.map((program) => ({
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

        console.log(`✅ Approved and saved ${missingPrograms.length} missing programs to database`);

        // Delete temp file after successful approval
        const tempFilePath = path.join(__dirname, '../../temp-crawls', `${institutionId}.json`);

        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
            console.log(`✓ Deleted temp file: ${tempFilePath}`);
        }

        return res.status(200).json({
            message: 'Programs approved successfully',
            approvedCount: missingPrograms.length,
            skippedCount: errors.length + (normalized.length - missingPrograms.length),
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
