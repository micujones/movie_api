const jwt = require('jsonwebtoken'),
    passport = require('passport'),
    dotenv = require('dotenv').config();

require('./passport');

let generateJWTToken = (user) => {
    return jwt.sign(user, process.env.JWT_SECRET, {
        subject: user.username,
        expiresIn: '7d',
        algorithm: 'HS256',
    });
};

/**
 * Logs a user into their account.
 *
 * @async
 * @name POST /login
 * @example
 * // Request body
 * {
 *  username: "wise_old_wizard",
 *  password: "staffofpower123"
 * }
 *
 * // Response
 * {
 *  "token": "xxxxx.yyyyy.zzzzz",
 *  "user": {
 *      "_id": "676d80bd2c4cb1f883f6656e",
 *      "username": "wise_old_wizard",
 *      "password": "staffofpower123",
 *      "email": "gandalf@middle-earth.net",
 *      "birthday": "1000-01-01",
 *      "favoriteMovies": [
 *          "6772ea661615b4a930ae9635",
 *          "6772ea661615b4a930ae962f"
 *      ],
 *      "__v": 0
 *  }
 * }
 * @returns {Object} Object includes registered user data and a generated JWT token
 */
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

                    let token = generateJWTToken(user.toJSON());
                    return res.json({ user, token });
                });
            }
        )(req, res);
    });
};
