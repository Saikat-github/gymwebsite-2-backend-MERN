export const authAdmin = (roles) => {
    return (req, res, next) => {
        try {
            if (!req.isAuthenticated()) {
                return res.json({success: false, message: 'Not authenticated' });
            }
            req.userAuthId = req.user._id;
            const userRole = req.user.userType;
            if (!roles.includes(userRole)) {
                return res.status(403).json({success: false, message: 'Insufficient permissions' });
            }
            next()
        } catch (error) {
            console.log(error)
            res.json({ success: false, message: error.message });
        }
    };
};
