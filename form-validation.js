import { body, validationResult } from "express-validator";
import sanitizeHtml from "sanitize-html";

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
export const reviewFormValidationRules = [...nameAndMessageValidationRules];
export const contactFormValidationRules = [
    ...nameAndMessageValidationRules,
    body("email").isEmail().withMessage("Invalid email address"),
    body("tel").optional().custom(validateUkPhoneNumber),
    body("company").optional().trim(),
];

// Validation middleware function
export const validationMiddleware = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => error.msg);
        return res.status(400).json({ errors: errorMessages });
    }
    next();
};

// Sanitization function
export const sanitizeFormData = (req) => {
    for (const key in req.body) {
        req.body[key] = sanitizeHtml(req.body[key]);
    }
};
