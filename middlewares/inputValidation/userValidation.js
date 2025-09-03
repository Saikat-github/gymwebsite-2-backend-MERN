import { body, param, query } from 'express-validator';

// Validation middleware for doctor registration
export const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters long and contain letters and numbers')
];

// Validation middleware for doctor login
export const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Validation middleware for forgot password
export const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email')
];

// Validation middleware for reset password
export const resetPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isNumeric().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters long and contain letters and numbers')
];




// Common health info validation
const healthInfoValidation = [
  body("height").optional().isNumeric().withMessage("Height must be a number"),
  body("weight").optional().isNumeric().withMessage("Weight must be a number"),
  body("goal").optional().isString().withMessage("Goal must be a string"),
  body("hadMedicalCondition")
    .optional()
    .isBoolean().withMessage("HadMedicalCondition must be true or false"),
  body("otherConditions")
    .optional()
    .isString().withMessage("Other conditions must be a string")
];

// Create Profile Validation
export const createProfileValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("phone").isMobilePhone().withMessage("Please provide a valid phone number"),
  body("gender")
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be male, female, or other"),
  body("dob").isISO8601().withMessage("Invalid date of birth"),
  body("emergencyName").optional().isString(),
  body("emergencyPhone").optional().isMobilePhone(),
  body("emergencyRelation").optional().isString(),
  body("termsAndPolicy")
    .equals("true")
    .withMessage("You must agree to the terms and policy"),
  ...healthInfoValidation
];

// Update Profile Validation (all optional except email if present)
export const updateProfileValidation = [
  body("name").optional().isString(),
  body("email").optional().isEmail().withMessage("Please provide a valid email"),
  body("phone").optional().isMobilePhone(),
  body("gender")
    .optional()
    .isIn(["male", "female", "other"]),
  body("dob").optional().isISO8601(),
  body("emergencyName").optional().isString(),
  body("emergencyPhone").optional().isMobilePhone(),
  body("emergencyRelation").optional().isString(),
  body("termsAndPolicy")
    .optional()
    .isBoolean(),
  ...healthInfoValidation
];






export const createMembershipValidation = [
  body("planId")
    .notEmpty().withMessage("planId is required")
    .isMongoId().withMessage("Invalid planId"),

  // Validate dayPassData only if it exists in the request
  body("dayPassData").optional().isObject().withMessage("dayPassData must be an object"),

  body("dayPassData.name")
    .if(body("dayPassData").exists())
    .notEmpty().withMessage("Name is required"),

  body("dayPassData.age")
    .if(body("dayPassData").exists())
    .isInt({ min: 12, max: 100 }).withMessage("Age must be valid"),

  body("dayPassData.noOfDays")
    .if(body("dayPassData").exists())
    .isInt({ min: 1, max: 7 }).withMessage("Days must be between 1 and 7"),

  body("dayPassData.phone")
    .if(body("dayPassData").exists())
    .isMobilePhone().withMessage("Invalid phone"),

  body("dayPassData.email")
    .if(body("dayPassData").exists())
    .isEmail().withMessage("Invalid email"),

  body("dayPassData.terms")
    .if(body("dayPassData").exists())
    .equals("true").withMessage("Terms must be accepted"),
];
