const Joi = require('joi');
const nodemailer = require('nodemailer');
const Job = require('../models/Job');
const Company = require('../models/Company');
const EmailLog = require('../models/EmailLog');

const jobSchema = Joi.object({
    title: Joi.string().min(4).max(100).required().messages({
        'string.empty': 'Job title is required',
        'string.min': 'Job title should have at least 4 characters',
        'string.max': 'Job title should not exceed 100 characters',
    }),
    description: Joi.string().min(10).max(500).required().messages({
        'string.empty': 'Job description is required',
        'string.min': 'Job description should have at least 10 characters',
        'string.max': 'Job description should not exceed 500 characters',
    }),
    experienceLevel: Joi.string().valid('Entry', 'Mid', 'Senior').required().messages({
        'string.empty': 'Experience level is required',
        'any.only': 'Experience level must be one of the following: Entry, Mid, Senior',
    }),
    endDate: Joi.date().greater('now').required().messages({
        'date.base': 'End date must be a valid date',
        'date.greater': 'End date must be in the future',
        'any.required': 'End date is required',
    }),
    companyId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
        'string.pattern.base': 'Invalid Company ID format',
        'string.empty': 'Company ID is required',
    }),
    candidates: Joi.array()
        .items(
            Joi.object({
                email: Joi.string().email().required().messages({
                    'string.empty': 'Candidate email is required',
                    'string.email': 'Candidate email must be a valid email address',
                }),
            })
        )
        .min(1)
        .required()
        .messages({
            'array.min': 'At least one candidate is required',
        }),
});

const sendEmailsToCandidates = async (candidates, job) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    for (const candidate of candidates) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: candidate.email,
            subject: `Invitation to Apply for ${job.title} Position`,
            html: `
                <p>Dear ${candidate.email},</p>
                <p>We are pleased to invite you to apply for the following job opportunity:</p>
                <h2>${job.title}</h2>
                <p><strong>Description:</strong> ${job.description}</p>
                <p><strong>Experience Level Required:</strong> ${job.experienceLevel}</p>
                <p><strong>Application Deadline:</strong> ${new Date(job.endDate).toLocaleDateString()}</p>
                <p>To apply or get more details, please visit our website.</p>
                <p>We look forward to receiving your application!</p>
                <p>Best regards,<br/>The Recruitment Team</p>
            `,
        };
        let emailStatus = 'success';

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Email sent successfully to ${candidate.email}`);
        } catch (error) {
            console.error(`Failed to send email to ${candidate.email}:`, error);
            emailStatus = 'failed';
        }

        const emailLog = new EmailLog({
            jobId: job._id,
            recipientEmail: candidate.email,
            status: emailStatus,
        });

        await emailLog.save();
    }
};

exports.create = async (req, res) => {
    const { error } = jobSchema.validate(req.body);

    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { title, description, experienceLevel, endDate, companyId, candidates } = req.body;

    try {
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: 'Company not found.' });
        }
        if (!company?.isEmailVerified || !company?.isPhoneVerified) {
            return res.status(404).json({ message: 'Please first verify your phone number and email.' });
        }

        const job = new Job({
            title,
            description,
            experienceLevel,
            endDate,
            companyId,
            candidates,
        });

        await job.save();

        await sendEmailsToCandidates(candidates, job);

        res.status(201).json({ message: 'Job created successfully and emails sent to candidates.' });
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ message: 'Internal server error.', error });
    }
};

exports.findAll = async (req, res) => {
    try {
        const jobs = await Job.find(); 
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.', error });
    }
};

exports.find = async (req, res) => {
    const { id } = req.params;

    try {
        const job = await Job.findById(id); 

        if (!job) {
            return res.status(404).json({ message: 'Job not found.' });
        }

        res.status(200).json(job);
    } catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({ message: 'Internal server error.', error });
    }
};


