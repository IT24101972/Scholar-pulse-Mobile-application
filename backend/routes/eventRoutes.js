const express = require('express');
const router = express.Router();
const { getEvents, createEvent, toggleInterest, updateEvent, deleteEvent } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', getEvents);
router.post('/', protect, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), createEvent);
router.put('/:id', protect, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), updateEvent);
router.delete('/:id', protect, deleteEvent);
router.post('/:id/interest', protect, toggleInterest);

module.exports = router;
