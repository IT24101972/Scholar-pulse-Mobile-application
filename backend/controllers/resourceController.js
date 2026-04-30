const Resource = require('../models/Resource');

// @desc    Get all personal resources (files/folders)
// @route   GET /api/resources
// @access  Private
exports.getResources = async (req, res) => {
    try {
        const parent = req.query.parent || null;
        const resources = await Resource.find({ 
            author: req.user.id,
            parent: parent
        }).sort({ type: 1, name: 1 }); // Folders first, then alphabetically

        res.status(200).json({ status: 'success', count: resources.length, data: resources });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

// @desc    Get all public resources
// @route   GET /api/resources/public
// @access  Private
exports.getPublicResources = async (req, res) => {
    try {
        const resources = await Resource.find({ 
            isPublic: true, 
            faculty: req.user.faculty 
        })
            .populate('author', 'fullName studentId faculty')
            .sort({ createdAt: -1 });

        res.status(200).json({ status: 'success', count: resources.length, data: resources });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

// @desc    Get saved resources
// @route   GET /api/resources/saved
// @access  Private
exports.getSavedResources = async (req, res) => {
    try {
        const resources = await Resource.find({ 
            isSavedBy: req.user.id
        })
            .populate('author', 'fullName studentId faculty')
            .sort({ createdAt: -1 });

        res.status(200).json({ status: 'success', count: resources.length, data: resources });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

// @desc    Create a new resource (folder or upload)
// @route   POST /api/resources
// @access  Private
exports.createResource = async (req, res) => {
    try {
        req.body.author = req.user.id;
        req.body.faculty = req.user.faculty;
        
        // If a file was uploaded, extract metadata
        if (req.file) {
            req.body.name = req.file.originalname;
            req.body.url = `/uploads/${req.file.filename}`;
            
            // Format size
            const sizeInBytes = req.file.size;
            if (sizeInBytes < 1024) req.body.size = sizeInBytes + ' B';
            else if (sizeInBytes < 1024 * 1024) req.body.size = (sizeInBytes / 1024).toFixed(1) + ' KB';
            else req.body.size = (sizeInBytes / (1024 * 1024)).toFixed(1) + ' MB';

            // Determine type
            const ext = req.file.originalname.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) req.body.type = 'image';
            else if (['pdf'].includes(ext)) req.body.type = 'pdf';
            else if (['doc', 'docx'].includes(ext)) req.body.type = 'doc';
            else req.body.type = 'other';
        }

        const resource = await Resource.create(req.body);
        res.status(201).json({ status: 'success', data: resource });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

// @desc    Update a resource (rename, toggle share)
// @route   PATCH /api/resources/:id
// @access  Private
exports.updateResource = async (req, res) => {
    try {
        let resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({ status: 'error', message: 'Resource not found' });
        }

        if (resource.author.toString() !== req.user.id) {
            return res.status(401).json({ status: 'error', message: 'Not authorized' });
        }

        resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ status: 'success', data: resource });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

// @desc    Delete a resource
// @route   DELETE /api/resources/:id
// @access  Private
exports.deleteResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({ status: 'error', message: 'Resource not found' });
        }

        if (resource.author.toString() !== req.user.id) {
            return res.status(401).json({ status: 'error', message: 'Not authorized' });
        }

        // If it's a folder, we might want to handle children, but for now just delete the item.
        await resource.deleteOne();

        res.status(200).json({ status: 'success', data: {} });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

// @desc    Toggle Save/Bookmark
// @route   POST /api/resources/:id/save
// @access  Private
exports.toggleSave = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({ status: 'error', message: 'Resource not found' });
        }

        const isSaved = resource.isSavedBy.some(id => id.toString() === req.user.id);

        if (isSaved) {
            resource.isSavedBy = resource.isSavedBy.filter(id => id.toString() !== req.user.id);
        } else {
            resource.isSavedBy.push(req.user.id);
        }

        await resource.save();

        const populatedResource = await Resource.findById(resource._id).populate('author', 'fullName studentId faculty');

        res.status(200).json({ status: 'success', data: populatedResource });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

// @desc    Get recent files (excluding folders)
// @route   GET /api/resources/recent
// @access  Private
exports.getRecentResources = async (req, res) => {
    try {
        const resources = await Resource.find({ 
            author: req.user.id,
            type: { $ne: 'folder' }
        })
        .sort({ createdAt: -1 })
        .limit(50);

        res.status(200).json({ status: 'success', count: resources.length, data: resources });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};
