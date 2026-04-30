const LostFoundItem = require('../models/LostFoundItem');

// @desc    Get all lost and found items
// @route   GET /api/lostfound
// @access  Public
const getLostFoundItems = async (req, res) => {
    try {
        const items = await LostFoundItem.find()
            .populate('reporter', 'fullName avatar email phoneNumber') // Populate the reporter info
            .sort({ createdAt: -1 }); // Newest first

        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching lost and found items:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a lost/found item
// @route   POST /api/lostfound
// @access  Private
const createLostFoundItem = async (req, res) => {
    try {
        const { type, title, description, date, location, image, phoneNumber } = req.body;

        if (!type || !title || !location || !date) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const item = await LostFoundItem.create({
            type,
            title,
            description,
            date,
            location,
            image,
            phoneNumber,
            reporter: req.user._id // Assuming user is attached via protect middleware
        });

        // Populate reporter info before sending back to frontend
        const populatedItem = await LostFoundItem.findById(item._id).populate('reporter', 'fullName avatar email phoneNumber');

        res.status(201).json(populatedItem);
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a lost/found item
// @route   PUT /api/lostfound/:id
// @access  Private
const updateLostFoundItem = async (req, res) => {
    try {
        const item = await LostFoundItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Check ownership
        if (item.reporter.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to update this item' });
        }

        const updatedItem = await LostFoundItem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate('reporter', 'fullName avatar email phoneNumber');

        res.status(200).json(updatedItem);
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a lost/found item
// @route   DELETE /api/lostfound/:id
// @access  Private
const deleteLostFoundItem = async (req, res) => {
    try {
        const item = await LostFoundItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Check ownership
        if (item.reporter.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this item' });
        }

        await item.deleteOne();

        res.status(200).json({ message: 'Item removed' });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Admin: Delete ANY lost/found item (no ownership check)
// @route   DELETE /api/lostfound/admin/:id
// @access  Private (Admin only)
const adminDeleteLostFoundItem = async (req, res) => {
    try {
        const item = await LostFoundItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        await item.deleteOne();

        res.status(200).json({ message: 'Item removed by admin' });
    } catch (error) {
        console.error('Error admin-deleting item:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getLostFoundItems,
    createLostFoundItem,
    updateLostFoundItem,
    deleteLostFoundItem,
    adminDeleteLostFoundItem,
};
