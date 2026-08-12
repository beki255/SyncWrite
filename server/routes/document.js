const express = require('express');
const Document = require('../models/Document');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all documents for the user (owned and shared)
router.get('/', auth, async (req, res) => {
  try {
    const docs = await Document.find({
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id }
      ]
    }).populate('owner', 'name email').sort({ updatedAt: -1 });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single document
router.get('/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email')
      .populate('versions.createdBy', 'name email');
    
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check permissions
    const isOwner = doc.owner._id.toString() === req.user._id.toString();
    const collaborator = doc.collaborators.find(c => c.user._id.toString() === req.user._id.toString());
    
    if (!isOwner && !collaborator) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new document
router.post('/', auth, async (req, res) => {
  try {
    const doc = new Document({
      title: req.body.title || 'Untitled Document',
      owner: req.user._id,
      collaborators: []
    });
    await doc.save();
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-save document content
router.put('/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Check permissions
    const isOwner = doc.owner.toString() === req.user._id.toString();
    const collaborator = doc.collaborators.find(c => c.user.toString() === req.user._id.toString());
    
    if (!isOwner && (!collaborator || collaborator.role !== 'Editor')) {
      return res.status(403).json({ error: 'Only Editors can modify the document content' });
    }

    if (req.body.data !== undefined) doc.data = req.body.data;
    if (req.body.title !== undefined) doc.title = req.body.title;
    
    await doc.save();
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a document
router.delete('/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (doc.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the owner can delete the document' });
    }

    await doc.deleteOne();
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Share a document
router.post('/:id/share', auth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (doc.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the owner can share the document' });
    }

    const User = require('../models/User');
    const userToShareWith = await User.findOne({ email: req.body.email });
    if (!userToShareWith) {
      return res.status(404).json({ error: 'User with this email not found' });
    }

    // Check if already a collaborator
    const exists = doc.collaborators.find(c => c.user.toString() === userToShareWith._id.toString());
    if (exists) {
      return res.status(400).json({ error: 'User is already a collaborator' });
    }

    doc.collaborators.push({ user: userToShareWith._id, role: req.body.role || 'Editor' });
    await doc.save();
    await doc.populate('owner', 'name email');
    await doc.populate('collaborators.user', 'name email');
    
    // Create a notification for the recipient
    const Notification = require('../models/Notification');
    await Notification.create({
      recipient: userToShareWith._id,
      sender: req.user._id,
      document: doc._id,
      message: `${req.user.name || 'Someone'} shared '${doc.title}' with you.`
    });
    
    res.json({ message: 'Document shared successfully', doc });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save a new version
router.post('/:id/versions', auth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Check permissions
    const isOwner = doc.owner.toString() === req.user._id.toString();
    const collaborator = doc.collaborators.find(c => c.user.toString() === req.user._id.toString());
    
    if (!isOwner && (!collaborator || collaborator.role !== 'Editor')) {
      return res.status(403).json({ error: 'Only Editors can save versions' });
    }

    doc.versions.push({
      data: req.body.data,
      createdBy: req.user._id
    });
    
    await doc.save();
    
    // Repopulate to return the full version info
    await doc.populate('versions.createdBy', 'name email');
    
    res.json({ message: 'Version saved successfully', versions: doc.versions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a version
router.delete('/:id/versions/:versionId', auth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const isOwner = doc.owner.toString() === req.user._id.toString();
    const collaborator = doc.collaborators.find(c => c.user.toString() === req.user._id.toString());
    
    if (!isOwner && (!collaborator || collaborator.role !== 'Editor')) {
      return res.status(403).json({ error: 'Only Editors can delete versions' });
    }

    doc.versions = doc.versions.filter(v => v._id.toString() !== req.params.versionId);
    
    await doc.save();
    await doc.populate('versions.createdBy', 'name email');
    
    res.json({ message: 'Version deleted successfully', versions: doc.versions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unshare a document (Remove collaborator)
router.delete('/:id/share/:userId', auth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (doc.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the owner can remove collaborators' });
    }

    doc.collaborators = doc.collaborators.filter(
      (c) => c.user.toString() !== req.params.userId
    );
    await doc.save();
    
    // Repopulate for frontend
    await doc.populate('owner', 'name email');
    await doc.populate('collaborators.user', 'name email');
    
    res.json({ message: 'Collaborator removed', doc });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
