const express = require('express'),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path'),
    bodyParser = require('body-parser'),
    uuid = require('uuid');

const mongoose = require('mongoose'),
    Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

// mongoose.connect('mongodb://127.0.0.1:27017/mostwatchedlistDB');
mongoose.connect(process.env.CONNECTION_URI);

const { forEach, uniqueId } = require('lodash');

const app = express();
// create a write stream (in append mode)
// a 'log.txt' file is created in the root directory
// const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'});

// set up the logger
// app.use(morgan('combined', {stream: accessLogStream}));
app.use(bodyParser.json());

// Cross-origin resource sharing
const cors = require('cors');
let allowedOrigins = [
    'http://localhost:8080',
    'https://mostwatchedlist-f9604e12841c.herokuapp.com',
    'http://localhost:1234',
    'https://mostwatchedlist.netlify.app',
    'http://localhost:4200',
    'https://micujones.github.io',
];
/**
 * const allowedOrigins = process.env.ALLOWED_ORIGINS
 * ? process.env.ALLOWED_ORIGINS.split(',')
 * : ['http://localhost:8080'];
 */

app.use(cors()); // allow all orgins

/**
    app.use(
        cors({
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (!allowedOrigins.includes(origin)) {
                    let message = `The CORS policy for this application doesn't allow access from origin ${origin}`;
                    return callback(new Error(message), false);
                }
                return callback(null, true);
            },
        })
    ); 
*/

// AUTHENTICATION
let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

const { check, validationResult } = require('express-validator');

app.get('/', (req, res) => {
    res.send('Welcome to my app!');
});

app.get('/documentation', (req, res) => {
    res.sendFile('public/documentation.html', { root: __dirname });
});

app.get('/index', (req, res) => {
    res.sendFile('public/index.html', { root: __dirname });
});

// READ METHODS

// READ DATA FOR MOVIES

/**
 * Returns a JSON array of movie objects.
 *
 * @async
 * @name GET /movies
 * @example
 * [{
 *  "genre:" {
 *      "name": "Action",
 *      "description": "Action films are fast-paced movies characterized by intense sequences of physical feats, chases, battles, and stunts, often revolving around high-stakes conflicts and heroic protagonists."
 *  },
 *  "director": {
 *      "name": "Michael Bay",
 *      "bio": "Michael Bay is a renowned filmmaker known for directing high-octane action blockbusters featuring explosive visuals, dynamic camera work, and massive box-office success",
 *      "birth": "1965"
 *  },
 *  "_id": "676d807a2c4cb1f883f66563",
 *  "title": "Transformers",
 *  "description": "Two factions of alien robots bring their ancient conflict to Earth, and humanity's fate hangs in the balance.",
 *  "actors": [
 *      "Shia LaBeouf",
 *      "Megan Fox",
 *      "Peter Cullen",
 *      "John Turturro"
 *  ],
 *  "imagePath": "transformers.png",
 *  "featured": true
 * },
 * ...
 * @returns {Array<Object>} Array includes objects containing movie data
 */
app.get(
    '/movies',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        await Movies.find()
            .then((movies) => {
                if (movies) {
                    res.status(200).json(movies);
                } else {
                    res.status(204).send('Movie list does not exist.');
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send(`Error: ${error}.`);
            });
    }
);

/**
 * Returns a JSON object containing data about the user-provided movie.
 *
 * @async
 * @name GET /movies/:title
 * @example
 * <caption>/movies/Transformers</caption>
 * {
 *  "genre:" {
 *      "name": "Action",
 *      "description": "Action films are fast-paced movies characterized by intense sequences of physical feats, chases, battles, and stunts, often revolving around high-stakes conflicts and heroic protagonists."
 *  },
 *  "director": {
 *      "name": "Michael Bay",
 *      "bio": "Michael Bay is a renowned filmmaker known for directing high-octane action blockbusters featuring explosive visuals, dynamic camera work, and massive box-office success",
 *      "birth": "1965"
 *  },
 *  "_id": "676d807a2c4cb1f883f66563",
 *  "title": "Transformers",
 *  "description": "Two factions of alien robots bring their ancient conflict to Earth, and humanity's fate hangs in the balance.",
 *  "actors": [
 *      "Shia LaBeouf",
 *      "Megan Fox",
 *      "Peter Cullen",
 *      "John Turturro"
 *  ],
 *  "imagePath": "transformers.png",
 *  "featured": true
 * }
 * @returns {Object} Object consists of movie data
 */
app.get('/movies/:title', async (req, res) => {
    await Movies.find({ title: req.params.title })
        .then((movie) => {
            if (movie[0]) {
                // Returns the object in an array,
                // which will only include one item at 0 index, so it needs index.
                res.status(200).json(movie);
            } else {
                res.status(204).send(
                    `"${req.params.title}" is not in database.`
                );
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(`Error: ${error}.`);
        });
});

/**
 * Returns a description of the user-provided genre.
 *
 * @async
 * @name GET /movies/genre/:genre
 * @example
 * <caption>/movies/genre/Action</caption>
 * "Action films are fast-paced movies characterized by intense sequences of physical feats, chases, battles, and stunts, often revolving around high-stakes conflicts and heroic protagonists."
 * @returns {string} String describes the genre.
 */
app.get('/movies/genre/:genre', async (req, res) => {
    await Movies.findOne({ 'genre.name': req.params.genre })
        .then((movie) => {
            if (movie) {
                res.status(200).json(movie.genre.description);
            } else {
                res.status(204).send(
                    `No movies match the ${req.params.genre.toLowerCase()} genre.`
                );
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(`Error: ${error}.`);
        });
});

/**
 * Returns a JSON object with the director's name and bio.
 *
 * @async
 * @name GET /movies/director/:directorName
 * @example
 * <caption>/movies/director/Christopher%20Nolan</caption>
 * {
 *  "name": "Christopher Nolan",
 *  "bio": "Christopher Nolan is a critically acclaimed filmmaker known for his thought-provoking and visually stunning films, often exploring complex themes of identity and reality."
 * }
 * @returns {Object}
 */
app.get('/movies/director/:directorName', async (req, res) => {
    await Movies.findOne({ 'director.name': req.params.directorName })
        .then((movie) => {
            if (movie) {
                res.status(200).json(movie.director);
            } else {
                res.status(204).send(
                    `No movies have ${req.params.directorName} listed as a director.`
                );
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(`Error: ${error}.`);
        });
});

// READ DATA FOR USERS

/**
 * Returns an array of users.
 *
 * @async
 * @name GET /users
 * @example
 * [{
 *  "favoriteMovies": [],
 *  "_id": "676d80bd2c4cb1f883f6656d",
 *  "name": "Lord Farquaad",
 *  "username": "official_lordfarquaad",
 *  "email": "farquaad@example.kingdom",
 *  "password": "imissprincessfiona",
 *  "birthday": "1985-02-19T00:00:00.000Z"
 * },
 * {
 *  "favoriteMovies": [],
 *  "_id": "676d80bd2c4cb1f883f6656e",
 *  "name": "Gandalf the Grey",
 *  "username": "wise_old_wizard",
 *  "email": "gandalf@middle-earth.net",
 *  "password": "staffofpower123",
 *  "birthday": "1000-01-01T00:00:00.000Z"
 * },
 * ... ]
 * @returns {Array<Object>} Array consists of user objects
 */
app.get('/users', async (req, res) => {
    await Users.find()
        .then((users) => {
            if (users) {
                res.status(200).json(users);
            } else {
                res.status(204).send('No users have been registered.');
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(`Error: ${error}.`);
        });
});

/**
 * Returns a JSON object of user's data.
 *
 * @async
 * @name GET /users/:username
 * @example
 * <caption>/users/wise_old_wizard</caption>
 * {
 *  "favoriteMovies": [],
 *  "_id": "676d80bd2c4cb1f883f6656e",
 *  "name": "Gandalf the Grey",
 *  "username": "wise_old_wizard",
 *  "email": "gandalf@middle-earth.net",
 *  "password": "staffofpower123",
 *  "birthday": "1000-01-01T00:00:00.000Z"
 * }
 * @returns {Object} Object contains user data
 */
app.get(
    '/users/:username',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        // Check that user is altering their own data
        if (req.user.username !== req.params.username) {
            return res.status(401).send('Permission denied.');
        }

        await Users.findOne({ username: req.params.username })
            .then((user) => {
                if (user) {
                    res.status(200).json(user);
                } else {
                    res.status(204).send(
                        `User with the username @${req.params.username} does not exist.`
                    );
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send(`Error: ${error}.`);
            });
    }
);

/**
 * Returns a JSON array of the IDs
 * of the user's favorite movies.
 *
 * @async
 * @name GET /users/:username/movies
 * @example
 * <caption>/users/wise_old_wizard/movies</caption>
 * [
 *  "676d807a2c4cb1f883f66563",
 *  "686bfaa5cc39c5753f9ffc21",
 *  "686bfa5acc39c5753f9ffc1f"
 * ]
 * @returns {Array<string>} Array includes strings of movie IDs
 */
app.get(
    '/users/:username/movies',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        await Users.findOne({ username: req.params.username })
            .then(async (user) => {
                if (user) {
                    if (user.favoriteMovies.length < 1) {
                        res.status(204).send(
                            `@${user.username} has not added any movies.`
                        );
                    } else {
                        let movieTitlesList = [];

                        for (i = 0; i < user.favoriteMovies.length; i++) {
                            let movie = await getMovieDocument(
                                user.favoriteMovies[i]
                            );
                            movieTitlesList.push(
                                `${movie.title} (ID: ${user.favoriteMovies[i]})`
                            );
                        }
                        res.status(200).json(movieTitlesList.sort());
                    }
                } else {
                    res.status(204).send(
                        `User with the username @${req.params.username} does not exist.`
                    );
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send(`Error: ${error}.`);
            });
    }
);

async function getMovieDocument(id) {
    return await Movies.findById(id);
}

// CREATE & UPDATE METHODS

/**
 * Returns a JSON object with the new user's data (required fields).
 *
 * @async
 * @name POST /users
 * @example
 * // Request body
 * {
 *  "username": "FlorencePizza",
 *  "password": "FourFireHazards444",
 *  "email": "florentine@example.com",
 *  "birthday": "1983-04-24",
 *  "favoriteMovies": []
 * }
 *
 * // Response
 * {
 *  "username": "FlorencePizza",
 *  "password": "FourFireHazards444",
 *  "email": "florentine@example.com",
 *  "birthday": "1983-04-24",
 *  "favoriteMovies": [],
 *  "_id": "676f01fbf9acd94021a88be4",
 *  "__v": 0
 * }
 * @returns {Object} Object includes user-input data and generated ID
 */
app.post(
    '/users',
    [
        check('username', 'Username is required.').isLength({ min: 7 }),
        check(
            'username',
            'Username cannot contain non-alphanumeric characters.'
        ).isAlphanumeric(),
        check('password', 'Password must be at least 10 characters.').isLength({
            min: 10,
        }),
        check('email', 'Email does not appear to be valid.').isEmail(),
    ],
    async (req, res) => {
        // Check validation object for errors
        let errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() });

        let hashedPassword = Users.hashPassword(req.body.password);

        await Users.findOne({ username: req.body.username })
            .then((user) => {
                if (user) {
                    return res
                        .status(400)
                        .send(`${req.body.username} already exists.`);
                } else {
                    Users.create({
                        username: req.body.username,
                        password: hashedPassword,
                        email: req.body.email,
                        birthday: req.body.birthday,
                    })
                        .then((user) => {
                            res.status(201).json(user);
                        })
                        .catch((error) => {
                            console.error(error);
                            res.status(500).send(`Error: ${error}.`);
                        });
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send(`Error: ${error}.`);
            });
    }
);

/**
 * Returns a JSON object with the user's updated data.

 *
 * @async
 * @name PUT /users/:username
 * @example
 * // Request body with new password
 * {
 *  "username": "FlorencePizza",
 *  "password": "aStrongerPassword555", // was "FourFireHazards444"
 *  "email": "florentine@example.com",
 *  "birthday": "1983-04-24",
 * }
 *
 * // Response
 * {
 *  "_id": "676f01fbf9acd94021a88be4",
 *  "username": "FlorencePizza",
 *  "password": "aStrongerPassword555",
 *  "email": "florentine@example.com",
 *  "birthday": "1983-04-24",
 *  "favoriteMovies": [
 *      "6772ea661615b4a930ae9635",
 *      "6772ea661615b4a930ae962f"
 *  ],
 *  "__v": 0
 * }
 * @returns {Object} Object reflects changes in user data
 */
app.put(
    '/users/:username',
    [
        check('username', 'Username is required.').isLength({ min: 7 }),
        check(
            'username',
            'Username cannot contain non-alphanumeric characters.'
        ).isAlphanumeric(),
        check('password', 'Password must be at least 10 characters.').isLength({
            min: 10,
        }),
        check('email', 'Email does not appear to be valid.').isEmail(),
    ],
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        // Check validation object for errors
        let errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() });

        // Check that user is altering their own data
        // if (req.user.username !== req.params.username) {
        //     return res.status(401).send('Permission denied.');
        // }

        // Update relevant information
        await Users.findOne({ username: req.params.username }).then(() => {
            if (req.user.password === req.body.password) {
                Users.findOneAndUpdate(
                    { username: req.params.username },
                    {
                        $set: {
                            username: req.body.username,
                            // Do not update password; hashing nightmare
                            email: req.body.email,
                            birthday: req.body.birthday,
                        },
                    },
                    { new: true }
                ) // Makes sure that the updated document is returned
                    .then((updatedUser) => {
                        res.status(201).json(updatedUser);
                    })
                    .catch((error) => {
                        console.error(error);
                        res.status(500).send(`Error: ${error}.`);
                    });
            } else {
                let hashedPassword = Users.hashPassword(req.body.password);

                Users.findOneAndUpdate(
                    { username: req.params.username },
                    {
                        $set: {
                            username: req.body.username,
                            password: hashedPassword,
                            email: req.body.email,
                            birthday: req.body.birthday,
                        },
                    },
                    { new: true }
                ) // Makes sure that the updated document is returned
                    .then((updatedUser) => {
                        res.status(201).json(updatedUser);
                    })
                    .catch((error) => {
                        console.error(error);
                        res.status(500).send(`Error: ${error}.`);
                    });
            }
        });
    }
);

/**
 * Returns a JSON object of the user's information,
 * including the added movie's ID in the
 * favoriteMovies array.

 *
 * @async
 * @name POST /users/:username/movies/:movieId
 * @example
 * <caption>/users/wise_old_wizard/movies/676d807a2c4cb1f883f66567</caption>
 * {
 *  "_id": "676d80bd2c4cb1f883f6656e",
 *  "name": "Gandalf the Grey",
 *  "username": "wise_old_wizard",
 *  "email": "gandalf@middle-earth.net",
 *  "password": "staffofpower123",
 *  "birthday": "1000-01-01T00:00:00.000Z",
 *  "favoriteMovies": [
 *      "676d807a2c4cb1f883f66563",
 *      "676d807a2c4cb1f883f66567", // Added movie ID
 *      "686bfaa5cc39c5753f9ffc21",
 *      "686bfa5acc39c5753f9ffc1f"
 * ]}
 * @returns {Object} Object of user's data with added movie ID
 */
app.post(
    '/users/:username/movies/:movieId',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        // Check that user is altering their own data
        if (req.user.username !== req.params.username) {
            return res.status(401).send('Permission denied.');
        }

        await Users.findOneAndUpdate(
            { username: req.params.username },
            {
                $addToSet: { favoriteMovies: req.params.movieId },
            },
            { new: true }
        ) // Makes sure that the updated document is returned
            .then((updatedUser) => {
                res.status(201).json(updatedUser);
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send(`Error: ${error}.`);
            });
    }
);

// DELETE METHODS

/**
 * Returns a JSON object of the user's information,
 * confirming the movie is removed from the
 * favoriteMovies array.

 *
 * @async
 * @name DELETE /users/:username/movies/:movieId
 * @example
 * <caption>/users/wise_old_wizard/movies/686bfaa5cc39c5753f9ffc21</caption>
 * {
 *  "_id": "676d80bd2c4cb1f883f6656e",
 *  "name": "Gandalf the Grey",
 *  "username": "wise_old_wizard",
 *  "email": "gandalf@middle-earth.net",
 *  "password": "staffofpower123",
 *  "birthday": "1000-01-01T00:00:00.000Z",
 *  "favoriteMovies": [
 *      "676d807a2c4cb1f883f66563",
 *      "676d807a2c4cb1f883f66567",
 *      // "686bfaa5cc39c5753f9ffc21" was previously here
 *      "686bfa5acc39c5753f9ffc1f"
 * ]}
 * @returns {Object} Object of user's data without removed movie ID
 */
app.delete(
    '/users/:username/movies/:movieId',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        // Check that user is altering their own data
        if (req.user.username !== req.params.username) {
            return res.status(401).send('Permission denied.');
        }

        await Users.findOneAndUpdate(
            { username: req.params.username },
            {
                $pull: { favoriteMovies: req.params.movieId },
            },
            { new: true }
        )
            .then((updatedUser) => {
                res.status(200).json(updatedUser);
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send(`Error: ${error}.`);
            });
    }
);

/**
 * Returns a string confirming the user with the
 * provided username has been deleted.

 *
 * @async
 * @name DELETE /users/:username
 * @example
 * <caption>/users/ToBeDeleted</caption>
 * ToBeDeleted was deleted.
 * @returns {string} String is a message of a successful deletion
 */
app.delete(
    '/users/:username',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        // Check that user is altering their own data
        if (req.user.username !== req.params.username) {
            return res.status(401).send('Permission denied.');
        }

        await Users.findOneAndDelete({ username: req.params.username })
            .then((user) => {
                if (!user) {
                    res.status(204).send(
                        `${req.params.username} was not found.`
                    );
                } else {
                    res.status(200).send(`${req.params.username} was deleted.`);
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send(`Error: ${error}.`);
            });
    }
);

// log all application-level errors to the terminal.
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log(`Listening on Port ${port}.`);
});
