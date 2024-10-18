const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    experienceLevel: { type: String, required: true },
    endDate: { type: Date, required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    candidates: [{
        email: { type: String, required: true }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
