const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    type: {
        type: String,
        enum: ['folder', 'pdf', 'image', 'doc', 'other'],
        default: 'folder'
    },
    url: {
        type: String,
        default: ''
    },
    size: {
        type: String,
        default: '0 KB'
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    isSavedBy: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    parent: {
        type: mongoose.Schema.ObjectId,
        ref: 'Resource',
        default: null
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        default: 'General'
    },
    faculty: {
        type: String,
        enum: ['Computer Science', 'Architecture', 'Business', 'Engineering', 'Other'],
        default: 'Computer Science'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Resource', resourceSchema);
