const jwtSecret = 'your_jwt_secret';

const jwt = require('jsonwebtoken'),
    passport = require('passport');

require('./passport');

let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.username,
        expiresIn: '7d',
        algorithm: 'HS256',
    });
};

module.exports = (router) => {
    router.post('/login', (req, res) => {
        passport.authenticate(
            'local',
            { session: false },
            (error, user, info) => {
                if (error || !user) {
                    return res.status(400).json({
                        message: 'Something is not right.',
                        user: user,
                    });
                }
                req.login(user, { session: false }, (error) => {
                    if (error) {
                        res.send(error);
                    }

                    // START SUGGESTED FIX
                    // Check for existing token
                    const existingToken =
                        req.headers.authorization?.split(' ')[1];

                    if (existingToken) {
                        try {
                            const decoded = jwt.verify(
                                existingToken,
                                process.env.JWT_SECRET
                            );
                            if (decoded && decoded.exp * 1000 > Date.now()) {
                                // Token is still validc
                                return res.json({
                                    user,
                                    token: existingToken,
                                });
                            }
                        } catch (error) {
                            // Token is invalid or expired
                        }
                    }
                    // END SUGGESTED FIX

                    let token = generateJWTToken(user.toJSON());
                    return res.json({ user, token });
                });
            }
        )(req, res);
    });
};
