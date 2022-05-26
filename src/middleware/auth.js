const jwt = require("jsonwebtoken");
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        const token = req.header("Authorization").replace("Bearer ", '');
        const data = jwt.verify(token, process.env.SECRETE_KEY);
        const user = await User.findOne({ _id: data._id, 'tokens.token': token });
        if (!user) {
            throw new Error();
        }
        req.user = user;
        req.currentUserToken = token;
        next();
    } catch (e) {
        res.status(401).send({ error: 'you must be Authenticated' })
    }
}

module.exports = auth;