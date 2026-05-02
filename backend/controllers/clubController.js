const Club = require('../models/Club');
const ClubMember = require('../models/ClubMember');

/* ─────────────────────────────────────────────────────────────────────
   PUBLIC / STUDENT ENDPOINTS
───────────────────────────────────────────────────────────────────── */

// @desc    Get all active clubs (with membership status for current user)
// @route   GET /api/clubs
// @access  Private
exports.getClubs = async (req, res) => {
    try {
        const { category } = req.query;
        let query = { isActive: true };
        if (category && category !== 'All') query.category = category;

        const clubs = await Club.find(query)
            .populate('createdBy', 'fullName')
            .sort({ createdAt: -1 });

        // Attach current user's membership status to each club
        const userId = req.user?._id;
        let memberships = [];
        if (userId) {
            memberships = await ClubMember.find({
                user: userId,
                club: { $in: clubs.map(c => c._id) }
            });
        }

        const membershipMap = {};
        memberships.forEach(m => {
            membershipMap[m.club.toString()] = { status: m.status, role: m.roleInClub };
        });

        const clubsWithStatus = clubs.map(club => ({
            ...club.toObject(),
            myMembership: membershipMap[club._id.toString()] || null
        }));

        res.status(200).json({ status: 'success', count: clubs.length, data: clubsWithStatus });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Get single club with members
// @route   GET /api/clubs/:id
// @access  Private
exports.getClub = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id).populate('createdBy', 'fullName');
        if (!club) return res.status(404).json({ status: 'error', message: 'Club not found' });

        const members = await ClubMember.find({ club: req.params.id, status: 'approved' })
            .populate('user', 'fullName email studentId')
            .sort({ roleInClub: 1, joinedAt: 1 });

        // Current user membership
        let myMembership = null;
        if (req.user) {
            const m = await ClubMember.findOne({ club: req.params.id, user: req.user._id });
            if (m) myMembership = { status: m.status, role: m.roleInClub };
        }

        res.status(200).json({
            status: 'success',
            data: { ...club.toObject(), members, myMembership }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Request to join a club
// @route   POST /api/clubs/:id/join
// @access  Private (Student)
exports.joinClub = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ status: 'error', message: 'Club not found' });

        const existing = await ClubMember.findOne({ club: req.params.id, user: req.user._id });
        if (existing) {
            const msg = existing.status === 'approved'
                ? 'You are already a member of this club'
                : existing.status === 'pending'
                    ? 'Your join request is already pending'
                    : 'Your previous request was rejected. Contact admin.';
            return res.status(400).json({ status: 'error', message: msg });
        }

        const membership = await ClubMember.create({
            club: req.params.id,
            user: req.user._id,
            status: 'pending',
            applicantName:    req.body.applicantName    || '',
            applicantFaculty: req.body.faculty          || '',
            applicantYear:    req.body.year             || '',
            whyJoin:          req.body.whyJoin          || '',
            skills:           req.body.skills           || '',
        });

        res.status(201).json({ status: 'success', data: membership, message: 'Join request sent successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Leave a club
// @route   DELETE /api/clubs/:id/leave
// @access  Private (Student)
exports.leaveClub = async (req, res) => {
    try {
        const membership = await ClubMember.findOneAndDelete({
            club: req.params.id,
            user: req.user._id
        });
        if (!membership) return res.status(404).json({ status: 'error', message: 'You are not a member of this club' });

        // Decrement member count if was approved
        if (membership.status === 'approved') {
            await Club.findByIdAndUpdate(req.params.id, { $inc: { memberCount: -1 } });
        }

        res.status(200).json({ status: 'success', message: 'Left club successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────────
   ADMIN ENDPOINTS
───────────────────────────────────────────────────────────────────── */

// @desc    Create a club
// @route   POST /api/clubs
// @access  Private/Admin
exports.createClub = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ status: 'error', message: 'Not authorized' });

        const { name, description, category } = req.body;
        const clubData = { name, description, category, createdBy: req.user._id };

        if (req.files?.logo?.[0]) {
            clubData.logo = `/uploads/${req.files.logo[0].filename}`;
        } else if (req.body.logo) {
            clubData.logo = req.body.logo;
        }

        const missingFields = [];
        if (!name) missingFields.push('name');
        if (!description) missingFields.push('description');
        if (!category) missingFields.push('category');
        if (missingFields.length > 0) {
            return res.status(400).json({ status: 'error', message: `Missing: ${missingFields.join(', ')}` });
        }

        const club = await Club.create(clubData);
        res.status(201).json({ status: 'success', data: club });
    } catch (error) {
        const msg = error.code === 11000 ? 'A club with this name already exists' : error.message;
        res.status(400).json({ status: 'error', message: msg });
    }
};

// @desc    Update a club
// @route   PUT /api/clubs/:id
// @access  Private/Admin
exports.updateClub = async (req, res) => {
    try {
        let club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ status: 'error', message: 'Club not found' });

        const updateData = { ...req.body };
        if (req.files?.logo?.[0]) {
            updateData.logo = `/uploads/${req.files.logo[0].filename}`;
        }

        club = await Club.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        res.status(200).json({ status: 'success', data: club });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Delete a club (cascade delete members)
// @route   DELETE /api/clubs/:id
// @access  Private/Admin
exports.deleteClub = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ status: 'error', message: 'Club not found' });

        // Cascade delete all memberships
        await ClubMember.deleteMany({ club: req.params.id });
        await club.deleteOne();

        res.status(200).json({ status: 'success', message: 'Club and all memberships deleted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Get all pending join requests for a club (or all clubs)
// @route   GET /api/clubs/requests
// @access  Private/Admin
exports.getPendingRequests = async (req, res) => {
    try {
        const requests = await ClubMember.find({ status: 'pending' })
            .populate('user', 'fullName email studentId')
            .populate('club', 'name category logo')
            .sort({ createdAt: -1 });

        res.status(200).json({ status: 'success', count: requests.length, data: requests });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Approve or reject a join request
// @route   PUT /api/clubs/requests/:memberId
// @access  Private/Admin
exports.handleRequest = async (req, res) => {
    try {
        const { action } = req.body; // 'approve' or 'reject'
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ status: 'error', message: "Action must be 'approve' or 'reject'" });
        }

        const membership = await ClubMember.findById(req.params.memberId);
        if (!membership) return res.status(404).json({ status: 'error', message: 'Request not found' });
        if (membership.status !== 'pending') {
            return res.status(400).json({ status: 'error', message: 'Request already handled' });
        }

        if (action === 'approve') {
            membership.status = 'approved';
            membership.joinedAt = new Date();
            await membership.save();
            await Club.findByIdAndUpdate(membership.club, { $inc: { memberCount: 1 } });
            res.status(200).json({ status: 'success', message: 'Member approved', data: membership });
        } else {
            await membership.deleteOne();
            res.status(200).json({ status: 'success', message: 'Request rejected' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Update a member's role in a club
// @route   PUT /api/clubs/:clubId/members/:memberId/role
// @access  Private/Admin
exports.updateMemberRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['member', 'moderator', 'leader'].includes(role)) {
            return res.status(400).json({ status: 'error', message: 'Invalid role' });
        }

        const membership = await ClubMember.findOneAndUpdate(
            { club: req.params.clubId, user: req.params.memberId, status: 'approved' },
            { roleInClub: role },
            { new: true }
        ).populate('user', 'fullName email');

        if (!membership) return res.status(404).json({ status: 'error', message: 'Member not found' });

        res.status(200).json({ status: 'success', data: membership });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Remove a member from a club
// @route   DELETE /api/clubs/:clubId/members/:memberId
// @access  Private/Admin
exports.removeMember = async (req, res) => {
    try {
        const membership = await ClubMember.findOneAndDelete({
            club: req.params.clubId,
            user: req.params.memberId,
            status: 'approved'
        });
        if (!membership) return res.status(404).json({ status: 'error', message: 'Member not found' });

        await Club.findByIdAndUpdate(req.params.clubId, { $inc: { memberCount: -1 } });
        res.status(200).json({ status: 'success', message: 'Member removed' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Get all clubs with member counts (admin view)
// @route   GET /api/clubs/admin/all
// @access  Private/Admin
exports.getAdminClubs = async (req, res) => {
    try {
        const clubs = await Club.find()
            .populate('createdBy', 'fullName')
            .sort({ createdAt: -1 });

        res.status(200).json({ status: 'success', count: clubs.length, data: clubs });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Get all approved members of a club (admin view)
// @route   GET /api/clubs/:id/members
// @access  Private/Admin
exports.getClubMembers = async (req, res) => {
    try {
        const members = await ClubMember.find({ club: req.params.id, status: 'approved' })
            .populate('user', 'fullName email studentId')
            .sort({ roleInClub: 1, joinedAt: 1 });

        res.status(200).json({ status: 'success', count: members.length, data: members });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
