const express = require('express');
const { getLostFoundItems, createLostFoundItem, updateLostFoundItem, deleteLostFoundItem, adminDeleteLostFoundItem } = require('../controllers/lostFoundController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getLostFoundItems);
router.post('/', protect, createLostFoundItem);
router.put('/:id', protect, updateLostFoundItem);
router.delete('/:id', protect, deleteLostFoundItem);

// Admin-only: delete any item regardless of ownership
router.delete('/admin/:id', protect, adminOnly, adminDeleteLostFoundItem);

module.exports = router;
