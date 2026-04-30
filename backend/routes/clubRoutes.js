const express = require('express');
const router = express.Router();
const {
    getClubs, getClub, createClub, updateClub, deleteClub,
    joinClub, leaveClub,
    getPendingRequests, handleRequest,
    updateMemberRole, removeMember,
    getAdminClubs, getClubMembers
} = require('../controllers/clubController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Admin-only special routes (must come before /:id)
router.get('/admin/all', protect, getAdminClubs);
router.get('/requests', protect, getPendingRequests);
router.put('/requests/:memberId', protect, handleRequest);

// Main club CRUD
router.get('/', protect, getClubs);
router.post('/', protect, upload.fields([{ name: 'logo', maxCount: 1 }]), createClub);
router.get('/:id', protect, getClub);
router.put('/:id', protect, upload.fields([{ name: 'logo', maxCount: 1 }]), updateClub);
router.delete('/:id', protect, deleteClub);

// Student join/leave
router.post('/:id/join', protect, joinClub);
router.delete('/:id/leave', protect, leaveClub);

// Admin member management
router.get('/:id/members', protect, getClubMembers);
router.put('/:clubId/members/:memberId/role', protect, updateMemberRole);
router.delete('/:clubId/members/:memberId', protect, removeMember);

module.exports = router;
