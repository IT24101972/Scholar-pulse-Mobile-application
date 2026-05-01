const express = require('express');
const router = express.Router();
const { getNotices, createNotice, updateNotice, deleteNotice } = require('../controllers/noticeController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', getNotices);
router.post('/', protect, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'attachment', maxCount: 1 }]), createNotice);
router.put('/:id', protect, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'attachment', maxCount: 1 }]), updateNotice);
router.delete('/:id', protect, deleteNotice);

module.exports = router;
