const express = require('express');
const { getVaultItems, createVaultItem, deleteVaultItem } = require('../controllers/vaultController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, getVaultItems)
    .post(protect, createVaultItem);

router.route('/:id')
    .delete(protect, deleteVaultItem);

module.exports = router;
