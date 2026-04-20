const Event = require('../models/Event');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};
        
        if (category && category !== 'All') {
            query.category = category;
        }

        const events = await Event.find(query)
            .populate('author', 'fullName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            count: events.length,
            data: events
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Create an event
// @route   POST /api/events
// @access  Private/Admin
exports.createEvent = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ status: 'error', message: 'Not authorized' });
        }

        // Multer puts files in req.file and text fields in req.body
        const { title, description, date, time, location, category, isFeatured, baseInterestedCount } = req.body;
        
        const eventData = {
            title,
            description,
            date,
            time,
            location,
            category,
            isFeatured: isFeatured === 'true' || isFeatured === true,
            baseInterestedCount: Number(baseInterestedCount) || 0,
            author: req.user._id
        };
        
        // Handle Files (Multer fields puts them in req.files)
        if (req.files) {
            if (req.files.image && req.files.image[0]) {
                eventData.image = `/uploads/${req.files.image[0].filename}`;
            }
            if (req.files.video && req.files.video[0]) {
                eventData.video = `/uploads/${req.files.video[0].filename}`;
            }
        }

        // Fallback for image in req.body (legacy/edit without change)
        if (!eventData.image && req.body.image) {
            eventData.image = req.body.image;
        }
        if (!eventData.video && req.body.video) {
            eventData.video = req.body.video;
        }

        // Check for missing mandatory fields manually to send better error
        const missingFields = [];
        if (!eventData.title) missingFields.push('title');
        if (!eventData.description) missingFields.push('description');
        if (!eventData.date) missingFields.push('date');
        if (!eventData.time) missingFields.push('time');
        if (!eventData.location) missingFields.push('location');
        if (!eventData.category) missingFields.push('category');
        if (!eventData.image) missingFields.push('image');

        if (missingFields.length > 0) {
            return res.status(400).json({ 
                status: 'error', 
                message: `Missing fields: ${missingFields.join(', ')}`,
                debugInfo: { bodyReceived: req.body, filesReceived: !!req.files }
            });
        }

        const event = await Event.create(eventData);

        res.status(201).json({
            status: 'success',
            data: event
        });
    } catch (error) {
        console.error('Event Creation Error:', error);
        res.status(400).json({ 
            status: 'error', 
            message: error.message,
            errors: error.errors
        });
    }
};

// @desc    Toggle interest in event
// @route   POST /api/events/:id/interest
// @access  Private
exports.toggleInterest = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ status: 'error', message: 'Event not found' });
        }

        const isInterested = event.interestedUsers.includes(req.user.id);

        if (isInterested) {
            // Remove interest
            event.interestedUsers = event.interestedUsers.filter(
                id => id.toString() !== req.user.id.toString()
            );
        } else {
            // Add interest
            event.interestedUsers.push(req.user.id);
        }

        await event.save();

        res.status(200).json({
            status: 'success',
            data: event,
            isInterested: !isInterested
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private/Admin
exports.updateEvent = async (req, res) => {
    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ status: 'error', message: 'Event not found' });
        }

        const updateData = { ...req.body };

        // Handle Files
        if (req.files) {
            if (req.files.image && req.files.image[0]) {
                updateData.image = `/uploads/${req.files.image[0].filename}`;
            }
            if (req.files.video && req.files.video[0]) {
                updateData.video = `/uploads/${req.files.video[0].filename}`;
            }
        }

        if (req.body.isFeatured !== undefined) {
             updateData.isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;
        }

        event = await Event.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: event
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private/Admin
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ status: 'error', message: 'Event not found' });
        }

        // Check ownership
        if (event.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ status: 'error', message: 'Not authorized to delete this event' });
        }

        await event.deleteOne();

        res.status(200).json({
            status: 'success',
            message: 'Event removed'
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
