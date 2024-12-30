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

// array of top ten favorite movies
let movieList = [
    {
        title: 'Transformers',
        releaseYear: 2007,
        director: {
            name: 'Michael Bay',
            birthYear: 1965
        },
        genre: 'science fiction action',
        cover: 'https://upload.wikimedia.org/wikipedia/en/6/66/Transformers07.jpg?20241126113009'
    },
    {
        title: 'Captain America: Civil War',
        releaseYear: 2016,
        director: [{ 
            name: 'Anthony Russo',
            birthYear: 1970
        }, {
            name: 'Joe Russo',
            birthYear: 1971
        }],
        genre: 'superhero',
        cover: 'https://upload.wikimedia.org/wikipedia/en/5/53/Captain_America_Civil_War_poster.jpg'
    },
    {
        title: 'How the Grinch Stole Christmas',
        releaseYear: 2000,
        director: {
            name: 'Ron Howard',
            birthYear: 1954
        },
        genre: 'Christmas comedy',
        cover: 'https://upload.wikimedia.org/wikipedia/en/e/e7/How_the_Grinch_Stole_Christmas_film_poster.jpg'
    },
    {
        title: 'Zootopia',
        releaseYear: 2016,
        director: [{
            name: 'Byron Howard',
            birthYear: 1968
        }, {
            name: 'Rich Moore',
            birthYear: 1963
        }],
        genre: 'action comedy',
        cover: 'https://upload.wikimedia.org/wikipedia/en/9/96/Zootopia_%28movie_poster%29.jpg'
    },
    {
        title: 'The Incredibles',
        releaseYear: 2004,
        director: { 
            name: 'Brad Bird',
            birthYear: 1957
        },
        genre: 'superhero',
        cover: 'https://upload.wikimedia.org/wikipedia/en/2/27/The_Incredibles_%282004_animated_feature_film%29.jpg'
    },
    {
        title: 'The Pink Panther',
        releaseYear: 2006,
        director: { 
            name: 'Shawn Levy',
            birthYear: 1968
        },
        genre: 'mystery comedy',
        cover: 'https://upload.wikimedia.org/wikipedia/en/f/f2/Pinkpanther_mp.jpg'
    },
    {
        title: 'Shrek',
        releaseYear: 2001,
        director: [{
            name: 'Andrew Adamson',
            birthYear: 1966
        }, {
            name: 'Vicky Jenson',
            birthYear: 1960
        }],
        genre: 'fantasy comedy',
        cover: 'https://upload.wikimedia.org/wikipedia/en/7/7b/Shrek_%282001_animated_feature_film%29.jpg'
    },
    {
        title: 'Everything Everywhere All At Once',
        releaseYear: 2022,
        director: [{
            name: 'Daniel Kwan',
            birthYear: 1988
        }, { 
            name: 'Daniel Scheinert',
            birthYear: 1987
        }],
        genre: 'comedy drama',
        cover: 'https://upload.wikimedia.org/wikipedia/en/1/1e/Everything_Everywhere_All_at_Once.jpg'
    },
    {
        title: 'Bullet Train',
        releaseYear: 2022,
        director: { 
            name: 'David Leitch',
            birthYear: 1975
        },
        genre: 'action comedy',
        cover: 'https://upload.wikimedia.org/wikipedia/en/1/13/Bullet_Train_%28poster%29.jpeg'
    },
    {
        title: 'They Cloned Tyrone',
        releaseYear: 2023,
        director: {
            name: 'Juel Taylor',
            birthYear: 1987
        },
        genre: 'science fiction comedy mystery',
        cover: 'https://upload.wikimedia.org/wikipedia/en/5/53/They_cloned_tyrone_poster.png'
    }
];

let movieListByGenre = [];

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
app.get('/movies', async (req, res) => {
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
app.get('/movies/:Title', async (req, res) => {
    await Movies.find( { Title: req.params.Title })
        .then((movie) => {
            if (movie[0]) { // Returns the object in an array, 
            // which will only include one item at 0 index, so it needs index.
                res.status(200).json(movie);
            } else {
                res.status(404).send('Movie does not exist.');
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(`Error: ${error}.`);
        });
})

// Return data about a genre
app.get('/movies/genre/:Genre', async (req, res) => {
    await Movies.findOne( { "Genre.Name": req.params.Genre })
        .then((movie) => {
            if (movie) {
                res.status(200).json(movie.Genre.Description);
            } else {
                res.status(404).send(`No movies match the ${req.params.Genre.toLowerCase()} genre.`);
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(`Error: ${error}.`);
        });
})

// Return data about a director by name
app.get('/movies/director/:DirectorName', async (req, res) => {
    await Movies.findOne( { "Director.Name": req.params.DirectorName })
        .then((movie) => {
            if (movie) {
                res.status(200).json(movie.Director);
            } else {
                res.status(404).send(`No movies have ${req.params.DirectorName} listed as a director.`);
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
app.get('/users/:Username', async (req, res) => {
    await Users.findOne( { Username: req.params.Username })
        .then((user) => {
            if (user) {
                res.status(200).json(user);
            } else {
                res.status(404).send(`User with the username @${req.params.Username} does not exist.`);
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send(`Error: ${error}.`);
        });

});

app.get('/users/:Username/movies', async (req, res) => {
    await Users.findOne({ Username: req.params.Username })
        .then(async (user) => {
            if (user) {
                if (user.FavoriteMovies.length < 1) {
                    res.status(404).json(`@${user.Username} has not added any movies.`);
                } else {
                    let movieTitlesList = [];

                    for (i = 0; i < user.FavoriteMovies.length; i++) {
                        let movie = await getMovieDocument(user.FavoriteMovies[i]);
                        movieTitlesList.push(`${movie.Title} (ID: ${user.FavoriteMovies[i]})`);
                    }
                    res.status(200).json(movieTitlesList.sort());
                }
            } else {
                res.status(404).send(`User with the username @${req.params.Username} does not exist.`);
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
    await Users.findOne({ Username: req.body.Username })
        .then((user) => {
            if (user) {
                return res.status(400).send(`${req.body.Username} already exists.`);
            } else {
                Users.create({
                    Username: req.body.Username,
                    Password: req.body.Password,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday
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
app.put('/users/:Username', async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, { $set: 
        {
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday
        }
    },
    { new: true })
    .then((updatedUser) => {
        res.status(201).json(updatedUser);
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send(`Error: ${error}.`);
    });
})

// Allow users to add a movie to their list of favorites
app.post('/users/:Username/movies/:MovieID', async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
        $addToSet: { FavoriteMovies: req.params.MovieID }
    },
    { new: true })
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
app.delete('/users/:Username/movies/:MovieID', async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
        $pull: { FavoriteMovies: req.params.MovieID }
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
app.delete('/users/:Username', async (req, res) => {
    await Users.findOneAndDelete({ Username: req.params.Username })
        .then((user) => {
            if (!user) {
                res.status(404).send(`${req.params.Username} was not found.`);
            } else { 
                res.status(200).send(`${req.params.Username} was deleted.`);
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