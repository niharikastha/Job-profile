const Joi = require('joi');
const bcrypt = require('bcrypt');
const Company = require('../models/Company');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
// const twilio = require('twilio');

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
    phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
        'string.empty': 'Phone number is required',
        'string.pattern.base': 'Phone number must be a valid 10-digit Indian number starting with 6, 7, 8, or 9',
    }),
    password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]/)
        .required()
        .messages({
            'string.empty': 'Password is required',
            'string.min': 'Password should have at least 8 characters',
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
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
    const { name, email, phone, password, employeeSize } = req.body;

    const { error } = companyRegistrationSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error?.details?.map((detail) => detail?.message);
        return res.status(400).json({ message: 'Validation errors', errors: errorMessages });
    }

    try {
        const existingCompany = await Company.findOne({ email });
        if (existingCompany) {
            return res.status(400).json({ message: 'THis email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newCompany = new Company({
            name,
            email,
            phone,
            password: hashedPassword,
            employeeSize,
        });

        await newCompany.save();

        const token = jwt.sign({ companyId: newCompany._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({
            message: 'Company registered successfully.',
            company: {
                id: newCompany?._id,
                name: newCompany?.name,
                email: newCompany?.email,
                phone: newCompany?.phone,
                employeeSize: newCompany?.employeeSize,
            },
            token,
        });
        } catch (error) {
        res.status(500).json({ message: 'Server error during registration', error });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

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

        const isMatch = await bcrypt.compare(password, company?.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect password' });
        }

        const token = jwt.sign({ companyId: company?._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token, companyId: company?._id });
    } catch (error) {
        console.error('Error during login:', error); 
        res.status(500).json({ message: 'Server error during login', error: error?.message || error });
    }
};

