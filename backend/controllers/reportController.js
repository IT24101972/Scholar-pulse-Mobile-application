const Report = require('../models/Report');

// @desc    Get all reports
// @route   GET /api/reports
// @access  Public
exports.getReports = async (req, res) => {
    try {
        const reports = await Report.find().sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', count: reports.length, data: reports });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

// @desc    Get current user's reports
// @route   GET /api/reports/my
// @access  Private
exports.getMyReports = async (req, res) => {
    try {
        const reports = await Report.find({ author: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', count: reports.length, data: reports });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

// @desc    Create a new report
// @route   POST /api/reports
// @access  Private
exports.createReport = async (req, res) => {
    try {
        // Add user to req.body
        req.body.author = req.user.id;
        req.body.authorEmail = req.user.email;
        req.body.studentId = req.user.studentId;

        // Handle uploaded image file (from multer)
        if (req.file) {
            req.body.image = `/uploads/${req.file.filename}`;
        }

        const report = await Report.create(req.body);
        res.status(201).json({ status: 'success', data: report });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

// @desc    Delete a report
// @route   DELETE /api/reports/:id
// @access  Private
exports.deleteReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ status: 'error', message: 'Report not found' });
        }

        // Make sure user is report owner
        if (report.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ status: 'error', message: 'Not authorized to delete this report' });
        }

        await report.deleteOne();

        res.status(200).json({ status: 'success', data: {} });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

// @desc    Update a report
// @route   PUT /api/reports/:id
// @access  Private
exports.updateReport = async (req, res) => {
    try {
        let report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ status: 'error', message: 'Report not found' });
        }

        // Make sure user is report owner
        if (report.author.toString() !== req.user.id) {
            return res.status(401).json({ status: 'error', message: 'Not authorized to update this report' });
        }

        delete req.body.status; // prevent user from changing status

        if (req.file) {
            req.body.image = `/uploads/${req.file.filename}`;
        }

        report = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        res.status(200).json({ status: 'success', data: report });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

// ─── ADMIN ENDPOINTS ──────────────────────────────────────────────

// @desc    Get all reports (admin) with optional status filter
// @route   GET /api/reports/admin/all
// @access  Admin only
exports.getAllReportsAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ status: 'error', message: 'Not authorized' });
        }

        const filter = {};
        if (req.query.status && req.query.status !== 'All') {
            filter.status = req.query.status;
        }

        const reports = await Report.find(filter)
            .populate('author', 'fullName email studentId')
            .sort({ createdAt: -1 });

        // Build summary counts
        const total      = await Report.countDocuments();
        const pending    = await Report.countDocuments({ status: 'Pending' });
        const inProgress = await Report.countDocuments({ status: 'InProgress' });
        const resolved   = await Report.countDocuments({ status: 'Resolved' });

        res.status(200).json({
            status: 'success',
            count: reports.length,
            summary: { total, pending, inProgress, resolved },
            data: reports
        });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

// @desc    Update complaint status (admin)
// @route   PATCH /api/reports/admin/:id/status
// @access  Admin only
exports.updateReportStatus = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ status: 'error', message: 'Not authorized' });
        }

        const { status } = req.body;
        const validStatuses = ['Pending', 'InProgress', 'Resolved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Invalid status value' });
        }

        const report = await Report.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        ).populate('author', 'fullName email studentId');

        if (!report) {
            return res.status(404).json({ status: 'error', message: 'Report not found' });
        }

        res.status(200).json({ status: 'success', data: report });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

