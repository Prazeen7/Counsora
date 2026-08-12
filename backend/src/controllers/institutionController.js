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
        if (programs && programs.length > 0) {
            await Program.create(
                [{
                    institution: createdInstitution._id,
                    programs,
                }],
                { session }
            );
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

        // Check if programs already exist and are approved
        const existingPrograms = await Program.findOne({ institution: institutionId });
        
        if (existingPrograms && existingPrograms.programs.length > 0) {
            // Only prevent crawl if status is 'completed' (approved)
            if (existingPrograms.crawlStatus === 'completed') {
                console.log(`✓ Programs already approved (${existingPrograms.programs.length} programs)`);
                return res.status(200).json({
                    message: 'Programs already exist and are approved for this institution',
                    shouldCrawl: false,
                    programCount: existingPrograms.programs.length,
                    lastCrawled: existingPrograms.lastCrawled,
                    crawlStatus: existingPrograms.crawlStatus,
                });
            }
            
            // If pending_review, allow re-crawl or redirect to review
            if (existingPrograms.crawlStatus === 'pending_review') {
                console.log(`✓ Programs awaiting review (${existingPrograms.programs.length} programs)`);
                return res.status(200).json({
                    message: 'Programs are pending review',
                    shouldCrawl: false,
                    programCount: existingPrograms.programs.length,
                    lastCrawled: existingPrograms.lastCrawled,
                    crawlStatus: existingPrograms.crawlStatus,
                });
            }
        }

        console.log(`No existing approved programs found, starting crawl...`);

        // Update crawl status to in_progress (or create new document)
        if (existingPrograms) {
            // If there's an existing doc but it failed or has no programs, reset it
            existingPrograms.crawlStatus = 'in_progress';
            existingPrograms.programs = [];
            await existingPrograms.save();
        } else {
            await Program.create({
                institution: institutionId,
                programs: [],
                crawlStatus: 'in_progress',
            });
        }

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
            let programDoc = await Program.findOne({ institution: institutionId });
            
            if (programDoc) {
                console.log(`Found existing program doc, updating status to pending_review...`);
                console.log(`  - Current program count in DB: ${programDoc.programs.length}`);
                programDoc.crawlStatus = 'pending_review';
                programDoc.lastCrawled = new Date();
                // Keep programs empty until approved
                programDoc.programs = [];
                await programDoc.save();
                console.log(`  - After update: ${programDoc.programs.length} programs in DB (should be 0)`);
            } else {
                console.log(`Creating new program doc with status pending_review...`);
                await Program.create({
                    institution: institutionId,
                    programs: [],
                    crawlStatus: 'pending_review',
                    lastCrawled: new Date(),
                });
                console.log(`  - Created with 0 programs in DB`);
            }

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
            const programDoc = await Program.findOne({ institution: institutionId });
            if (programDoc) {
                programDoc.crawlStatus = 'failed';
                await programDoc.save();
                console.log(`Updated program document status to 'failed'`);
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

        const programDoc = await Program.findOne({ institution: institutionId });

        if (!programDoc) {
            return res.status(404).json({
                status: 'not_started',
                programCount: 0,
            });
        }

        console.log(`\n=== Get Crawl Status for ${institutionId} ===`);
        console.log(`DB Status: ${programDoc.crawlStatus}`);
        console.log(`DB Program Count: ${programDoc.programs.length}`);

        // If status is pending_review, get count from temp file
        let programCount = programDoc.programs.length;
        
        if (programDoc.crawlStatus === 'pending_review') {
            const tempFilePath = path.join(__dirname, '../../temp-crawls', `${institutionId}.json`);
            console.log(`Checking temp file: ${tempFilePath}`);
            
            if (fs.existsSync(tempFilePath)) {
                try {
                    const tempData = JSON.parse(fs.readFileSync(tempFilePath, 'utf8'));
                    programCount = tempData.length;
                    console.log(`✓ Found ${programCount} programs in temp file`);
                } catch (err) {
                    console.error('Error reading temp file for status:', err);
                }
            } else {
                console.warn(`⚠️  Temp file not found for pending_review status!`);
            }
        }

        console.log(`Returning status: ${programDoc.crawlStatus}, count: ${programCount}`);

        return res.status(200).json({
            status: programDoc.crawlStatus,
            programCount: programCount,
            lastCrawled: programDoc.lastCrawled,
            updatedAt: programDoc.updatedAt,
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

        const programDoc = await Program.findOne({ institution: institutionId });

        if (!programDoc) {
            return res.status(404).json({ error: 'No programs found' });
        }

        if (programDoc.crawlStatus !== 'pending_review') {
            return res.status(400).json({ 
                error: 'Programs are not in pending review status',
                currentStatus: programDoc.crawlStatus
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
            crawlStatus: programDoc.crawlStatus,
            lastCrawled: programDoc.lastCrawled,
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

        const programDoc = await Program.findOne({ institution: institutionId });

        if (!programDoc) {
            return res.status(404).json({ error: 'Program document not found' });
        }

        // Update programs and mark as completed
        programDoc.programs = normalized;
        programDoc.crawlStatus = 'completed';
        await programDoc.save();

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

        const programDoc = await Program.findOne({ institution: institutionId });

        if (!programDoc) {
            return res.status(404).json({ error: 'Program document not found' });
        }

        // Clear programs and reset status
        programDoc.programs = [];
        programDoc.crawlStatus = 'pending';
        await programDoc.save();

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
            try {
                // Try to parse as JSON
                updateData[key] = JSON.parse(value);
            } catch {
                // If not JSON, use as-is
                updateData[key] = value;
            }
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
            { new: true, runValidators: true }
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
