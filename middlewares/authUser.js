//user authentication middleware
const authUser = async (req, res, next) => {
  try {
    if (req.isAuthenticated() && req.user?.userType === "user") {
      // Attach userAuthId to the request object directly
      req.userAuthId = req.user._id;
      return next();
    } else {
      res.json({ success: false, message: 'Not authenticated' });
    }
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message });
  }
}

export default authUser;