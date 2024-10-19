const Joi = require('joi');
const Company = require('../models/Company');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { sendOtp } = require('../controllers/emailController');

const companyRegistrationSchema = Joi.object({
    name: Joi.string().min(4).max(50).required().messages({
        'string.empty': 'Company name is required',
        'string.min': 'Company name should have at least 2 characters',
        'string.max': 'Company name should not exceed 50 characters',
    }),
    email: Joi.string().email().required().messages({
        'string.empty': 'Email is required',
        'string.email': 'Email must be a valid email address',
    }),
    companyName: Joi.string().min(4).max(50).required().messages({
        'string.empty': 'Company name is required',
        'string.min': 'Company name should have at least 4 characters',
        'string.max': 'Company name should not exceed 50 characters',
    }),
    phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
        'string.empty': 'Phone number is required',
        'string.pattern.base': 'Phone number must be a valid 10-digit Indian number starting with 6, 7, 8, or 9',
    }),
    employeeSize: Joi.number().integer().min(1).max(10000).required().messages({
        'number.base': 'Employee size must be a number',
        'number.min': 'Employee size must be at least 1',
        'number.max': 'Employee size should not exceed 10,000',
    }),
});

const loginValidationSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.empty': 'Email is required',
        'string.email': 'Email must be a valid email address',
    }),
});

exports.signup = async (req, res) => {
    
    const { name, email, phone, companyName, employeeSize } = req.body;

    const { error } = companyRegistrationSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error?.details?.map((detail) => detail?.message);
        return res.status(400).json({ message: 'Validation errors', errors: errorMessages });
    }

    try {
        const existingCompany = await Company.findOne({ email });
        if (existingCompany) {
            return res.status(400).json({ message: 'This email   exists.' });
        }

        const company = new Company({
            name,
            email,
            phone,
            companyName,
            employeeSize,
        });

        await company.save();

        const token = jwt.sign({ companyId: company._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({
            message: 'Company registered successfully.',
            company: {
                id: company?._id,
                name: company?.name,
                email: company?.email,
                phone: company?.phone,
                employeeSize: company?.employeeSize,
                companyName: company?.companyName,
            },
            token,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration', error });
    }
};

exports.login = async (req, res) => {
    const { email } = req.body;

    const { error } = loginValidationSchema.validate({ email }, { abortEarly: false });
    if (error) {
        const errorMessages = error?.details?.map((detail) => detail?.message);
        return res.status(400).json({ message: 'Validation errors', errors: errorMessages });
    }

    try {
        const company = await Company.findOne({ email });
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        req.user = { companyId: company._id };
        req.body.medium = 'email'; 

        const otpResponse = await sendOtp(req); 

        if (otpResponse.status !== 200) {
            return res.status(otpResponse.status).json({ message: otpResponse.message, error: otpResponse.error });
        }

        const token = jwt.sign({ companyId: company?._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.status(200).json({ token, companyId: company?._id , Name: company?.name});
    } catch (error) {
        console.error('Error during login:', error); 
        res.status(500).json({ message: 'Server error during login', error: error?.message || error });
    }
};

exports.logout = async (req, res) => {
    const companyId = req.user.companyId; 
    
    try {
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        company.isEmailVerified = false;
        await company.save();

        res.status(200).json({ message: 'Logout successful.' });
    } catch (error) {
        console.log('Error during logout:', error);
        res.status(500).json({ message: 'Server error during logout', error: error.message });
    }
};
