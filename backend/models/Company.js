const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    companyName: { type: String, required: true },
    employeeSize: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationCode: { type: String }, // OTP 
    emailotpExpires: {type: Date }, 
    isPhoneVerified: { type: Boolean, default: false },
    phoneVerificationCode: { type: String }, // OTP 
    phoneotpExpires: {type: Date }, 
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);
