const mongoose = require('mongoose');

const EmailLogSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    recipientEmail: { type: String, required: true },
    status: { type: String, default: 'sent' },
}, { timestamps: true });

module.exports = mongoose.model('EmailLog', EmailLogSchema);
