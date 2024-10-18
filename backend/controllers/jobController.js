const Job = require('../models/Job');

exports.postJob = async (req, res) => {
    const { title, description, experienceLevel, endDate } = req.body;
    const companyId = req.user.companyId; // Retrieved from auth middleware

    const company = await Company.findById(companyId);

    if (!company || !company.isEmailVerified || !company.isPhoneVerified) {
        return res.status(403).json({ message: 'Please verify your email and mobile number to post a job' });
    }
    
    try {
        // Create a new job post
        const newJob = new Job({
            title,
            description,
            experienceLevel,
            endDate,
            companyId,
        });

        await newJob.save();
        res.status(201).json({ message: 'Job posted successfully', job: newJob });
    } catch (error) {
        res.status(500).json({ message: 'Server error while posting job', error });
    }
};

