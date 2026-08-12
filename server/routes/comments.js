const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Document = require('../models/Document');
const auth = require('../middleware/auth');

const checkAccess = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.documentId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const isOwner = doc.owner.toString() === req.user._id.toString();
    const collaborator = doc.collaborators.find(c => c.user.toString() === req.user._id.toString());
    
    if (!isOwner && !collaborator) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    req.document = doc;
    req.collaboratorRole = isOwner ? 'Owner' : collaborator.role;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

router.get('/:documentId', auth, checkAccess, async (req, res) => {
  try {
    const comments = await Comment.find({ documentId: req.params.documentId })
      .populate('createdBy', 'name email')
      .populate('replies.createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:documentId', auth, checkAccess, async (req, res) => {
  if (req.collaboratorRole === 'Viewer') {
    return res.status(403).json({ error: 'Viewers cannot add comments' });
  }
  try {
    const comment = new Comment({
      documentId: req.params.documentId,
      text: req.body.text,
      createdBy: req.user._id
    });
    await comment.save();
    await comment.populate('createdBy', 'name email');
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:documentId/:commentId/reply', auth, checkAccess, async (req, res) => {
  if (req.collaboratorRole === 'Viewer') {
    return res.status(403).json({ error: 'Viewers cannot reply to comments' });
  }
  try {
    const comment = await Comment.findOne({ _id: req.params.commentId, documentId: req.params.documentId });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    
    comment.replies.push({
      text: req.body.text,
      createdBy: req.user._id
    });
    
    await comment.save();
    await comment.populate('createdBy', 'name email');
    await comment.populate('replies.createdBy', 'name email');
    
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:documentId/:commentId/resolve', auth, checkAccess, async (req, res) => {
  if (req.collaboratorRole === 'Viewer') {
    return res.status(403).json({ error: 'Viewers cannot resolve comments' });
  }
  try {
    const comment = await Comment.findOne({ _id: req.params.commentId, documentId: req.params.documentId });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    
    comment.resolved = !comment.resolved;
    await comment.save();
    await comment.populate('createdBy', 'name email');
    await comment.populate('replies.createdBy', 'name email');
    
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:documentId/:commentId', auth, checkAccess, async (req, res) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.commentId, documentId: req.params.documentId });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    
    const isDocOwner = req.document.owner.toString() === req.user._id.toString();
    const isCommentAuthor = comment.createdBy.toString() === req.user._id.toString();
    
    if (!isDocOwner && !isCommentAuthor) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }
    
    await Comment.findByIdAndDelete(req.params.commentId);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
