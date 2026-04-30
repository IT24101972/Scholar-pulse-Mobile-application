const mongoose = require('mongoose');

const vaultItemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title for the vault item'],
    },
    subtext: {
        type: String, // e.g., 'Silver • M2 Chip'
        required: false,
    },
    image: {
        type: String,
        required: [true, 'Please provide an image for the vault item'],
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('VaultItem', vaultItemSchema);
