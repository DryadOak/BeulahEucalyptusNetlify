const { body, validationResult } = require("express-validator");
const sanitizeHtml = require("sanitize-html");
const fetch = require('node-fetch');

// Function to validate UK phone numbers
const validateUkPhoneNumber = (value) => {
    const ukLandlinePhoneRegex = /\s*\(?(0[1-6]{1}[0-9]{3}\)?[0-9]{6})\s*/;
    const ukMobilePhoneRegex =
        /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/;
    if (ukLandlinePhoneRegex.test(value) || ukMobilePhoneRegex.test(value)) {
        return true;
    }
    throw new Error("Invalid phone number");
};

// Validation rules
const nameAndMessageValidationRules = [
    body("name").not().isEmpty().withMessage("Name is required"),
    body("message")
        .not()
        .isEmpty()
        .isLength({ max: 2000 })
        .withMessage("Message is required"),
];
const reviewFormValidationRules = [...nameAndMessageValidationRules];
const contactFormValidationRules = [
    ...nameAndMessageValidationRules,
    body("email").isEmail().withMessage("Invalid email address"),
    body("tel").optional().custom(validateUkPhoneNumber),
    body("company").optional().trim(),
];

// Validation middleware function
const validationMiddleware = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // const redirectPath = req.originalUrl.replace(/^\/app/, '');
        // res.set('Location', redirectPath);

        const errorMessages = errors.array().map((error) => error.msg);
        return res.status(200).json({ errors: errorMessages });
    }
    next();
};
// ReCaptcha Validation
const reCaptchaValidation = (req, res, next) => {
    const params = new URLSearchParams({
            secret: RECAPTCHA_SECRET_KEY,
            response: req.body['g-recaptcha-response'],
            remoteip: req.ip,
        })
        fetch("https://www.google.com/recaptcha/api/siteverify", {
              method: "POST",
              body: params,
        })
        .then(response => response.json())
        .then(data => {
            if(data.success){
                next();
            } else{
                return res.status(200).json({ errors: "reCaptcha failed"})
            }
        })
}

// Sanitization function
const sanitizeFormData = (req) => {
    for (const key in req.body) {
        req.body[key] = sanitizeHtml(req.body[key]);
    }
};

module.exports = {
    reCaptchaValidation,
    reviewFormValidationRules,
    contactFormValidationRules,
    validationMiddleware,
    sanitizeFormData,
};