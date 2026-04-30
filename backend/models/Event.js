const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    date: {
        type: String,
        required: [true, 'Please add a date']
    },
    time: {
        type: String,
        required: [true, 'Please add a time']
    },
    location: {
        type: String,
        required: [true, 'Please add a location']
    },
    category: {
        type: String,
        required: [true, 'Please add a category'],
        enum: ['Social', 'Academic', 'Sports', 'Workshops']
    },
    image: {
        type: String,
        required: [true, 'Please add an image URL']
    },
    video: {
        type: String,
        default: ''
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    baseInterestedCount: {
        type: Number,
        default: 0
    },
    externalLink: {
        type: String,
        default: ''
    },
    interestedUsers: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);
