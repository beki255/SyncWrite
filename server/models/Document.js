const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true, default: 'Untitled Document' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  data: { type: Object, default: '' }, // We might store the Yjs document state as a binary buffer, or ShareDB JSON. For Yjs, it's often better to let y-websocket handle memory/redis, but since we are persisting, we can store the update buffer.
  collaborators: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['Viewer', 'Commenter', 'Editor'], default: 'Viewer' }
  }],
  versions: [{
    data: { type: Object },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
