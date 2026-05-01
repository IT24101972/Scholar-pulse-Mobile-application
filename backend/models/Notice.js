const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    faculty: {
        type: String,
        required: [true, 'Please select a faculty'],
        enum: ['All', 'Computing', 'Business', 'Engineering', 'Law']
    },
    type: {
        type: String,
        required: [true, 'Please add a type'],
        enum: ['urgent', 'general', 'event', 'admin'],
        default: 'general'
    },
    attachment: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    isImportant: {
        type: Boolean,
        default: false
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notice', noticeSchema);
