const Notice = require('../models/Notice');

// @desc    Get all notices (optionally filter by faculty)
// @route   GET /api/notices
// @access  Public
exports.getNotices = async (req, res) => {
    try {
        const { faculty } = req.query;
        let query = {};

        if (faculty && faculty !== 'All') {
            query.$or = [{ faculty: faculty }, { faculty: 'All' }];
        }

        const notices = await Notice.find(query)
            .populate('author', 'fullName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            count: notices.length,
            data: notices
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Create a notice
// @route   POST /api/notices
// @access  Private/Admin
exports.createNotice = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ status: 'error', message: 'Not authorized' });
        }

        const { title, description, faculty, type, isImportant } = req.body;

        const noticeData = {
            title,
            description,
            faculty,
            type: type || 'general',
            isImportant: isImportant === 'true' || isImportant === true,
            author: req.user._id
        };

        // Handle file uploads
        if (req.files) {
            if (req.files.image && req.files.image[0]) {
                noticeData.image = `/uploads/${req.files.image[0].filename}`;
            }
            if (req.files.attachment && req.files.attachment[0]) {
                noticeData.attachment = `/uploads/${req.files.attachment[0].filename}`;
            }
        }

        // Fallback for body fields (edit without new file)
        if (!noticeData.image && req.body.image) {
            noticeData.image = req.body.image;
        }
        if (!noticeData.attachment && req.body.attachment) {
            noticeData.attachment = req.body.attachment;
        }

        const missingFields = [];
        if (!noticeData.title) missingFields.push('title');
        if (!noticeData.description) missingFields.push('description');
        if (!noticeData.faculty) missingFields.push('faculty');

        if (missingFields.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: `Missing fields: ${missingFields.join(', ')}`
            });
        }

        const notice = await Notice.create(noticeData);

        res.status(201).json({
            status: 'success',
            data: notice
        });
    } catch (error) {
        console.error('Notice Creation Error:', error);
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// @desc    Update a notice
// @route   PUT /api/notices/:id
// @access  Private/Admin
exports.updateNotice = async (req, res) => {
    try {
        let notice = await Notice.findById(req.params.id);

        if (!notice) {
            return res.status(404).json({ status: 'error', message: 'Notice not found' });
        }

        const updateData = { ...req.body };

        if (req.files) {
            if (req.files.image && req.files.image[0]) {
                updateData.image = `/uploads/${req.files.image[0].filename}`;
            }
            if (req.files.attachment && req.files.attachment[0]) {
                updateData.attachment = `/uploads/${req.files.attachment[0].filename}`;
            }
        }

        if (req.body.isImportant !== undefined) {
            updateData.isImportant = req.body.isImportant === 'true' || req.body.isImportant === true;
        }

        notice = await Notice.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: notice
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Delete a notice
// @route   DELETE /api/notices/:id
// @access  Private/Admin
exports.deleteNotice = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);

        if (!notice) {
            return res.status(404).json({ status: 'error', message: 'Notice not found' });
        }

        if (notice.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ status: 'error', message: 'Not authorized to delete this notice' });
        }

        await notice.deleteOne();

        res.status(200).json({
            status: 'success',
            message: 'Notice removed'
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
