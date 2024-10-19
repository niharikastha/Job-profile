const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const TeleSignSDK = require('telesignsdk');
const Company = require('../models/Company'); 

const customerId = process.env.CUSTOMER_ID ;
const apiKey = process.env.API_KEY ;
const teleSignClient = new TeleSignSDK(customerId, apiKey);

const sendOtpEmail = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
            user: process.env.EMAIL_USER,      
            pass: process.env.EMAIL_PASSWORD,  
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,          
        to: email,                              
        subject: 'OTP for Cuvette',               
        html: `<p>Your One Time Password(OTP) for login is: <strong>${otp}</strong>. Please note that the OTP is valid for 1 hour. Please do not share this with anyone.</p>
                <p>Regards</p>
                <p>Cuvette team</p>`, 
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('OTP sent successfully');
        return;
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw new Error('Could not send OTP email');
    }
};
// OTP sent successfully
const sendOtpToPhone = (phoneNumber, otp) => {
    const message = `Your OTP code is ${otp}`;
    const messageType = 'OTP';

    try {
        teleSignClient.sms.message((error, responseBody) => {
            if (error) {
                throw new Error('Could not send OTP to phone');
            }
            console.log('OTP sent successfully via phone');
        }, phoneNumber, message, messageType);
        return;
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw new Error('Could not send OTP phone');
    }
   
};

exports.sendOtp = async (req, res) => {
    const { medium } = req.body; 
    console.log("🚀 ~ exports.sendOtp= ~ medium:", medium)

    try {
        const companyId = req.user?.companyId;

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 3600 * 1000;

        if (medium === 'email') {
            company.emailVerificationCode = otp;
            company.emailotpExpires = otpExpires;

            await sendOtpEmail(company?.email, otp); 
        } else if (medium === 'phone') {
            company.phoneVerificationCode = otp; 
            company.phoneotpExpires = otpExpires; 

            const formattedPhoneNumber = company?.phone.startsWith("+91") ? company.phone : `+91${company.phone}`;

            console.log("🚀 ~ exports.sendOtp= ~ formattedPhoneNumber:", formattedPhoneNumber)
            await sendOtpToPhone(formattedPhoneNumber, otp); 
        } else {
            return res.status(400).json({ message: 'Either email or phone must be provided' });
        }

        await company.save();
        return res.status(200).json({ status: 'success', message: 'OTP sent successfully' });
        
    } catch (error) {
        if (error?.name === 'JsonWebTokenError') {
            return res.status(401).json({ status: 'error', message: 'Invalid token' });
        }
        if (error instanceof mongoose.Error) {
            return res.status(400).json({ status: 'error', message: 'Database error', error: error?.message });
        }
        return res.status(500).json({ status: 'error', message: 'Server error', error: error.message }); 
    }
};


exports.verifyOtp = async (req, res) => {
    const { otp, medium } = req.body; 

    try {
        const companyId = req.user?.companyId;

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        if (medium === 'email') {
            if (company.emailVerificationCode !== otp || company.emailotpExpires < Date.now()) {
                return res.status(400).json({ message: 'Invalid or expired OTP for email' });
            }

            company.isEmailVerified = true;
            company.emailVerificationCode = undefined; 
            company.emailotpExpires = undefined;
            await company.save();

            return res.status(200).json({ message: 'Email verified successfully' });
        } else if (medium === 'phone') {
            if (company.phoneVerificationCode !== otp || company.phoneotpExpires < Date.now()) {
                return res.status(400).json({ message: 'Invalid or expired OTP for phone' });
            }

            company.isPhoneVerified = true;
            company.phoneVerificationCode = undefined; 
            company.phoneotpExpires = undefined;
            await company.save();

            return res.status(200).json({ message: 'Phone number verified successfully' });
        } else {
            return res.status(400).json({ message: 'Medium must be either "email" or "phone"' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during OTP verification', error });
    }
};
