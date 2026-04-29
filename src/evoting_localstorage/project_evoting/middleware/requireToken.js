const jwt = require('jsonwebtoken');
const { jwtkey } = require('../keys');
const { PO, Votes, Admin, Candidate, Voter,Receipt,Bulletin,Keys} = require('../models/User');
module.exports = async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).send({ error: "You must be logged in" });
    }

    const token = authorization.replace("Bearer ", "");
    console.log(token);
    jwt.verify(token, jwtkey, async (err, payload) => {
        if (err) {
            return res.status(401).send({ error: "You must be logged in!" });
        }

        const { userId } = payload;
        console.log(userId,"userId")
        try {
            // If not a PO, check if the user is an Admin
            const newAdmin = await Admin.findById(userId);
            console.log(newAdmin,"admin name")
            if (!newAdmin) {
                return res.status(401).send({ error: "User not found or unauthorized" });
            }

            req.user = newAdmin;
            next();
        } catch (error) {
            console.error("Error fetching user:", error);
            return res.status(500).send({ error: "Internal server error" });
        }
    });
};





