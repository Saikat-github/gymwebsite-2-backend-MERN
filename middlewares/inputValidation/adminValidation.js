import { body } from 'express-validator';

// Add New Plan Validation
export const addPlanValidation = [
    body("title")
        .notEmpty().withMessage("Title is required")
        .isString().withMessage("Title must be a string"),

    body("duration")
        .notEmpty().withMessage("Duration is required")
        .isInt({ min: 1 }).withMessage("Duration must be a positive integer"),

    body("discount")
        .optional({ checkFalsy: true })
        .isFloat().withMessage("Discount must be a number"),

    body("price")
        .notEmpty().withMessage("Price is required")
        .isFloat({ min: 0 }).withMessage("Price must be a positive number"),

    body("features")
        .optional({ checkFalsy: true })
        .isArray().withMessage("Features must be an array"),
];




// Update Plan Validation
export const updatePlanValidation = [
    body("planId")
        .notEmpty().withMessage("planId is required")
        .isMongoId().withMessage("Invalid planId"),

    body("title")
        .optional()
        .isString().withMessage("Title must be a string"),

    body("duration")
        .optional()
        .isInt({ min: 1 }).withMessage("Duration must be a positive integer"),

    body("discount")
        .optional({ checkFalsy: true })
        .isFloat({ min: 0, max: 100 }).withMessage("Discount must be between 0 and 100"),

    body("price")
        .optional()
        .isFloat({ min: 0 }).withMessage("Price must be a positive number"),

    body("features")
        .optional({ checkFalsy: true })
        .isArray().withMessage("Features must be an array"),
];



// Delete Plan Validation
export const deletePlanValidation = [
    body("planId")
        .notEmpty().withMessage("planId is required")
        .isMongoId().withMessage("Invalid planId"),
];




//Member update validation
export const updateMemberInfoValidation = [
    body("memberId")
        .notEmpty().withMessage("memberId is required")
        .isMongoId().withMessage("Invalid memberId"),

    body("noOfDays")
        .optional({ checkFalsy: true })
        .isInt({ min: 1 }).withMessage("noOfDays must be a positive integer"),

    body("verified")
        .optional({ checkFalsy: true })
        .isBoolean().withMessage("verify must be a boolean"),
];



//MemberId validation
export const memberIdValidation = [
    body("memberId")
        .notEmpty().withMessage("memberId is required")
        .isMongoId().withMessage("Invalid memberId"),
]

