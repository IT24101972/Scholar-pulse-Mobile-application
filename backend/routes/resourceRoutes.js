const express = require('express');
const { 
    getResources, 
    getPublicResources, 
    createResource, 
    updateResource, 
    deleteResource, 
    toggleSave,
    getRecentResources,
    getSavedResources
} = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect); // All resource routes are protected

router.get('/', getResources);
router.get('/public', getPublicResources);
router.get('/recent', getRecentResources);
router.get('/saved', getSavedResources);
router.post('/', upload.single('file'), createResource);
router.patch('/:id', updateResource);
router.delete('/:id', deleteResource);
router.post('/:id/save', toggleSave);

module.exports = router;
