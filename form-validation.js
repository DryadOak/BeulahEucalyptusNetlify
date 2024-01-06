const { body, validationResult } = require("express-validator");
const sanitizeHtml = require("sanitize-html");
const fetch = require('node-fetch');
require('dotenv').config();

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

// ReCaptcha validation rule
const reCaptchaValidationRule = body("g-recaptcha-response")
    .notEmpty()
    .withMessage("reCaptcha is required")
    .custom(async (value, { req }) => {
        const reCaptchaSecret = process.env.SITE_RECAPTCHA_SECRET;
        const params = new URLSearchParams({
            secret: reCaptchaSecret,
            response: value,
            remoteip: req.ip,
        });

        try {
            const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
                method: "POST",
                body: params,
            });

            const data = await response.json();

            if (data.success) {
                return Promise.resolve();
            } else {
                return Promise.reject("reCaptcha failed");
            }
        } catch (error) {
            return Promise.reject("Error validating reCaptcha");
        }
    });


// Validation rules
const nameAndMessageValidationRules = [
    body("name").not().isEmpty().withMessage("Name is required"),
    body("message")
        .not()
        .isEmpty()
        .isLength({ max: 2000 })
        .withMessage("Message is required"),
];
const reviewFormValidationRules = [...nameAndMessageValidationRules, reCaptchaValidationRule];
const contactFormValidationRules = [
    ...nameAndMessageValidationRules,
    body("email").isEmail().withMessage("Invalid email address"),
    body("tel").optional().custom(validateUkPhoneNumber),
    body("company").optional().trim(),
    reCaptchaValidationRule,
];

// Validation middleware function
const validationMiddleware = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => error.msg);
        return res.status(200).json({ errors: errorMessages });
    }
    next();
};

// Sanitization function
const sanitizeFormData = (req) => {
    for (const key in req.body) {
        req.body[key] = sanitizeHtml(req.body[key]);
    }
};

module.exports = {
    reviewFormValidationRules,
    contactFormValidationRules,
    validationMiddleware,
    sanitizeFormData,
};