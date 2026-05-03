const express = require('express');
const {
    getReports, getMyReports, createReport, deleteReport, updateReport,
    getAllReportsAdmin, updateReportStatus
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// ─── Admin routes (must come before /:id param routes) ───────────────
router.get('/admin/all', protect, getAllReportsAdmin);
router.patch('/admin/:id/status', protect, updateReportStatus);

// ─── Student routes ───────────────────────────────────────────────────
// Public route - Anyone can see community reports
router.get('/', getReports);
// Private routes - Logged in users only
router.get('/my', protect, getMyReports);
router.post('/', protect, upload.single('image'), createReport);
router.put('/:id', protect, upload.single('image'), updateReport);
router.delete('/:id', protect, deleteReport);

module.exports = router;
