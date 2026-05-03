const mongoose = require('mongoose');

const clubMemberSchema = new mongoose.Schema({
    club: {
        type: mongoose.Schema.ObjectId,
        ref: 'Club',
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    roleInClub: {
        type: String,
        enum: ['member', 'moderator', 'leader'],
        default: 'member'
    },
    joinedAt: {
        type: Date
    },
    // ── Join Request Form Fields ─────────────────────────────────────
    applicantName: { type: String, default: '' },
    applicantFaculty: { type: String, default: '' },
    applicantYear: { type: String, default: '' },
    whyJoin: { type: String, default: '' },
    skills: { type: String, default: '' },
}, {
    timestamps: true
});

// Ensure a user can only have one membership record per club
clubMemberSchema.index({ club: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('ClubMember', clubMemberSchema);
