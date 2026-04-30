const mongoose = require('mongoose');

const lostFoundItemSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['lost', 'found'],
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Please add a title for the item'],
    },
    description: {
        type: String,
        required: false, // Optional for found items usually
    },
    date: {
        type: String, // Keeping it simple for UI formats like "Oct 24, 2023"
        required: true,
    },
    location: {
        type: String,
        required: [true, 'Please provide the location'],
    },
    phoneNumber: {
        type: String, // Specifically requested by user
        required: false,
    },
    image: {
        type: String,
        required: false,
    },
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('LostFoundItem', lostFoundItemSchema);
