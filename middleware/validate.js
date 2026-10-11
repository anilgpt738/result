const { body, validationResult } = require('express-validator');

// studentApplication validation
const studentApplication = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('fatherName')
        .trim()
        .notEmpty().withMessage('Father Name is required'),
    body('mobile')
        .trim()
        .notEmpty().withMessage('Mobile is required')
        .isLength({ min: 10, max: 10 }).withMessage('Mobile must be 10 digits')
        .isNumeric().withMessage('Mobile must contain only digits'),
    body('email')
        .optional({ checkFalsy: true })
        .isEmail().withMessage('Must be a valid email'),
    body('course')
        .notEmpty().withMessage('Course is required'),
    body('dob')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage('Valid Date of Birth is required (YYYY-MM-DD)')
];

// loginValidation
const loginValidation = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

// studentLoginValidation
const studentLoginValidation = [
    body('appNo')
        .trim()
        .notEmpty().withMessage('Application/Registration Number is required'),
    body().custom((value, { req }) => {
        if (!req.body.mobile && !req.body.password) {
            throw new Error('Either mobile or password is required');
        }
        return true;
    }),
    body('mobile')
        .optional({ checkFalsy: true })
        .isLength({ min: 10, max: 10 }).withMessage('Mobile must be 10 digits')
        .isNumeric().withMessage('Mobile must contain only digits'),
    body('password')
        .optional({ checkFalsy: true })
];

// marksEntryValidation
const marksEntryValidation = [
    body('studentId')
        .notEmpty().withMessage('Student ID is required')
        .isMongoId().withMessage('Invalid Student ID format'),
    body('examId')
        .optional({ checkFalsy: true })
        .isMongoId().withMessage('Invalid Exam ID format'),
    body('marks')
        .notEmpty().withMessage('Marks data is required')
        .isArray().withMessage('Marks must be an array'),
    body('marks.*.subjectName')
        .notEmpty().withMessage('Subject name is required for each mark entry'),
    body('marks.*.maxMarks')
        .notEmpty().withMessage('Max marks is required')
        .isNumeric().withMessage('Max marks must be a number'),
    body('marks.*.marksObtained')
        .notEmpty().withMessage('Marks obtained is required')
        .isNumeric().withMessage('Marks obtained must be a number')
        .custom((value, { req, path }) => {
            if (value < 0) {
                throw new Error('Marks obtained cannot be negative');
            }
            return true;
        })
];

// paymentValidation
const paymentValidation = [
    body('studentId')
        .notEmpty().withMessage('Student ID is required')
        .isMongoId().withMessage('Invalid Student ID format'),
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
    body('paymentType')
        .notEmpty().withMessage('Payment Type is required')
        .isIn(['admission', 'installment', 'exam', 'certificate', 'other']).withMessage('Invalid Payment Type'),
    body('method')
        .notEmpty().withMessage('Payment Method is required')
        .isIn(['cash', 'upi', 'bank_transfer', 'card']).withMessage('Invalid Payment Method')
];

// handleValidationErrors middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            data: errors.array()
        });
    }
    next();
};

module.exports = {
    studentApplication,
    loginValidation,
    studentLoginValidation,
    marksEntryValidation,
    paymentValidation,
    handleValidationErrors
};
