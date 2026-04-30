const VaultItem = require('../models/VaultItem');

// @desc    Get user's vault items
// @route   GET /api/vault
// @access  Private
const getVaultItems = async (req, res) => {
    try {
        const items = await VaultItem.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching vault items:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add item to vault
// @route   POST /api/vault
// @access  Private
const createVaultItem = async (req, res) => {
    try {
        const { title, subtext, image } = req.body;

        if (!title || !image) {
            return res.status(400).json({ message: 'Please provide required fields (title, image)' });
        }

        const item = await VaultItem.create({
            title,
            subtext: subtext || 'My Item',
            image,
            user: req.user._id
        });

        res.status(201).json(item);
    } catch (error) {
        console.error('Error adding vault item:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete item from vault
// @route   DELETE /api/vault/:id
// @access  Private
const deleteVaultItem = async (req, res) => {
    try {
        const item = await VaultItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Make sure user owns the item
        if (item.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await item.deleteOne();
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        console.error('Error deleting vault item:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getVaultItems,
    createVaultItem,
    deleteVaultItem
};
