const express = require('express'),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path'),
    bodyParser = require('body-parser'),
    uuid = require('uuid');

const  mongoose = require('mongoose'),
    Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect('mongodb://127.0.0.1:27017/mostwatchedlistDB');

const { forEach, uniqueId } = require('lodash');

const app = express();
// create a write stream (in append mode)
// a 'log.txt' file is created in the root directory
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'});

// set up the logger
app.use(morgan('combined', {stream: accessLogStream}));
app.use(bodyParser.json());

// Cross-origin resource sharing
const cors = require('cors');
let allowedOrigins = ['http://localhost:8080']
app.use(cors({
    origin: (origin, callback) => {
        if(!origin) return callback(null, true);
        if(!allowedOrigins.includes(origin)) {
            let message = `The CORS policy for this application doesn't allow access from origin ${origin}`;
            return callback(new Error(message), false);
        }
        return callback(null, true);
    }
}));

// AUTHENTICATION
let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

app.get('/', (req, res) => {
  res.send('Welcome to my app!');
});

app.get('/documentation', (req, res) => {
    res.sendFile('public/documentation.html', { root: __dirname } );
});

app.get('/index', (req, res) => {
    res.sendFile('public/index.html', { root: __dirname } );
});


// READ METHODS

// READ DATA FOR MOVIES

// Return list of all movies
app.get('/movies', passport.authenticate('jwt', {session: false}), async (req, res) => {
    await Movies.find()
        .then((movies) => {
            if (movies) {
                res.status(200).json(movies);
            } else {
                res.status(404).send('Movie list does not exist.');
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(`Error: ${error}.`);
        });
});

// Return data about a single movie by title
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.find( { title: req.params.title })
        .then((movie) => {
            if (movie[0]) { // Returns the object in an array, 
            // which will only include one item at 0 index, so it needs index.
                res.status(200).json(movie);
            } else {
                res.status(404).send(`"${req.params.title}" is not in database.`);
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(`Error: ${error}.`);
        });
})

// Return data about a genre
app.get('/movies/genre/:genre', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findOne( { "genre.name": req.params.genre })
        .then((movie) => {
            if (movie) {
                res.status(200).json(movie.genre.description);
            } else {
                res.status(404).send(`No movies match the ${req.params.genre.toLowerCase()} genre.`);
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(`Error: ${error}.`);
        });
})

// Return data about a director by name
app.get('/movies/director/:directorName', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findOne( { "director.name": req.params.directorName })
        .then((movie) => {
            if (movie) {
                res.status(200).json(movie.director);
            } else {
                res.status(404).send(`No movies have ${req.params.directorName} listed as a director.`);
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(`Error: ${error}.`);
        });
})

// READ DATA FOR USERS

// Return list of users
app.get('/users', async (req, res) => {
    await Users.find()
        .then((users) => {
            if (users) {
                res.status(200).json(users);
            } else {
                res.status(404).send('No users have been registered.');
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(`Error: ${error}.`);
        });
});

// Return a single user by username
app.get('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    // Check that user is altering their own data
    if (req.user.username !== req.params.username) {
        return res.status(401).send('Permission denied.');
    }
    
    await Users.findOne( { username: req.params.username })
        .then((user) => {
            if (user) {
                res.status(200).json(user);
            } else {
                res.status(404).send(`User with the username @${req.params.username} does not exist.`);
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(`Error: ${error}.`);
        });

});

app.get('/users/:username/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOne({ username: req.params.username })
        .then(async (user) => {
            if (user) {
                if (user.favoriteMovies.length < 1) {
                    res.status(404).send(`@${user.username} has not added any movies.`);
                } else {
                    let movieTitlesList = [];

                    for (i = 0; i < user.favoriteMovies.length; i++) {
                        let movie = await getMovieDocument(user.favoriteMovies[i]);
                        movieTitlesList.push(`${movie.title} (ID: ${user.favoriteMovies[i]})`);
                    }
                    res.status(200).json(movieTitlesList.sort());
                }
            } else {
                res.status(404).send(`User with the username @${req.params.username} does not exist.`);
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(`Error: ${error}.`);
        });
});

async function getMovieDocument(id) {
    return await Movies.findById(id);
}

// CREATE & UPDATE METHODS

// Allow new users to register
app.post('/users', async (req, res) => {
    await Users.findOne({ username: req.body.username })
        .then((user) => {
            if (user) {
                return res.status(400).send(`${req.body.username} already exists.`);
            } else {
                Users.create({
                    username: req.body.username,
                    password: req.body.password,
                    email: req.body.email,
                    birthday: req.body.birthday
                })
                .then((user) => { res.status(201).json(user) })
                .catch((error) => {
                    console.error(error);
                    res.status(500).send(`Error: ${error}.`);
                })
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(`Error: ${error}.`);
        });
});

// Allow users to update their user info (username)
app.put('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    // Check that user is altering their own data
    if (req.user.username !== req.params.username) {
        return res.status(401).send('Permission denied.');
    }

    await Users.findOneAndUpdate({ username: req.params.username }, { $set: 
        {
            username: req.body.username,
            password: req.body.password,
            email: req.body.email,
            birthday: req.body.birthday
        }
    },
    { new: true }) // Makes sure that the updated document is returned
    .then((updatedUser) => {
        res.status(201).json(updatedUser);
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send(`Error: ${error}.`);
    });
})

// Allow users to add a movie to their list of favorites
app.post('/users/:username/movies/:movieId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    // Check that user is altering their own data
    if (req.user.username !== req.params.username) {
        return res.status(401).send('Permission denied.');
    }
    
    await Users.findOneAndUpdate({ username: req.params.username }, {
        $addToSet: { favoriteMovies: req.params.movieId }
    },
    { new: true }) // Makes sure that the updated document is returned
    .then((updatedUser) => {
        res.status(201).json(updatedUser);
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send(`Error: ${error}.`);
    });
});

// DELETE METHODS

// Allow users to remove a movie from their list of favorites
app.delete('/users/:username/movies/:movieId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    // Check that user is altering their own data
    if (req.user.username !== req.params.username) {
        return res.status(401).send('Permission denied.');
    }
    
    await Users.findOneAndUpdate({ username: req.params.username }, {
        $pull: { favoriteMovies: req.params.movieId }
    },
    { new: true })
    .then((updatedUser) => {
        res.status(200).json(updatedUser);
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send(`Error: ${error}.`);
    });
});

// Allow existing users to deregister
app.delete('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    // Check that user is altering their own data
    if (req.user.username !== req.params.username) {
        return res.status(401).send('Permission denied.');
    }
    
    await Users.findOneAndDelete({ username: req.params.username })
        .then((user) => {
            if (!user) {
                res.status(404).send(`${req.params.username} was not found.`);
            } else { 
                res.status(200).send(`${req.params.username} was deleted.`);
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(`Error: ${error}.`);
        });
});

// log all application-level errors to the terminal.
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});