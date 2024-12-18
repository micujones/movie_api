const express = require('express'),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path'),
    bodyParser = require('body-parser'),
    uuid = require('uuid');

const { forEach, uniqueId } = require('lodash');

const app = express();
// create a write stream (in append mode)
// a 'log.txt' file is created in the root directory
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'});

// set up the logger
app.use(morgan('combined', {stream: accessLogStream}));
app.use(bodyParser.json());

// array of users
let users = [
    {
        name: 'Lord Farquaad',
        id: 1,
        favoriteMovies: []
    },
    {
        name: 'LeBron James',
        id: 2,
        favoriteMovies: []
    }
];

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


// REST API

// Return list of all movies
app.get('/movies', (req, res) => {
    if (movieList) {
        res.status(200).json(movieList);
    } else {
        res.status(400).send('Movie list does not exist.')
    }
});

// Return data about a single movie by title
app.get('/movies/:title', (req, res) => {

    movieList.find((movie) => {
        if (movie && movie.title.toLowerCase() === req.params.title.toLowerCase()) {
            res.status(200).json(movie);
        } else {
            res.status(400).send('Movie could not be found.')
        }
    })
});

// Return data about a genre
app.get('/movies/genres/:genre', (req, res) => {
    let movieListByGenre = [];

    movieList.forEach((movie) => {
        if (movie.genre.toLowerCase().includes(req.params.genre.toLowerCase())) {
            movieListByGenre.push(movie);
        }
    });

    if (movieListByGenre.length > 0) {
        res.status(200).json(movieListByGenre);
    } else {
        res.status(400).send(`No movies match the ${req.params.genre.toLowerCase()} genre.`)
    }
});

// Return data about a director by name
app.get('/movies/directors/:directorName', (req, res) => {
    let directorData; // Initialize the director object
    let directorName = req.params.directorName.replace('%20', ' ').toLowerCase(); // Keep track of the director's name

    movieList.forEach((movie) => {
        if (movie.director.length > 1) { // Search movies with multiple directors
            for (i = 0; i < movie.director.length; i++) {
                if (movie.director[i].name.toLowerCase() === directorName) {
                    directorData = movie.director[i];
                }
            }
        } else if (movie.director.name.toLowerCase() === directorName) {
            directorData = movie.director;
        }
    })

    let message = `${directorData.name} was born in ${directorData.birthYear}.`; 
    res.send(message);
});

// Return list of users
app.get('/users', (req, res) => {
    res.json(users);
})

// Allow new users to register
app.post('/users', (req, res) => {
    const newUser = req.body;

    if (newUser.name) {
        newUser.id = uuid.v4();
        users.push(newUser);
        res.status(201).json(newUser);
    } else { 
        res.status(400).send('Users need names.');
    }
});

// Allow users to update their user info (username)
app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const updatedUser = req.body;

    let user = users.find( user => user.id == id );

    if (user) {
        user.name = updatedUser.name;
        res.status(200).json(user);
    } else {
        res.status(400).send('User does not exist.')
    }
});

// Allow users to add a movie to their list of favorites (showing only a text that a movie has been added—more on this later);
app.post('/users/:id/:movieTitle', (req, res) => {
    const { id, movieTitle } = req.params;

    let user = users.find( user => user.id == id );

    if (user) {
        user.favoriteMovies.push(movieTitle);
        res.status(201).send(`${movieTitle} has been added to favorites!`);
    } else { 
        res.status(400).send('The movie could not be added.');
    }
});

// Allow users to remove a movie from their list of favorites (showing only a text that a movie has been removed—more on this later);
app.delete('/users/:id/:movieTitle', (req, res) => {
    const { id, movieTitle } = req.params;

    let user = users.find( user => user.id == id );

    if (user) {
        user.favoriteMovies = user.favoriteMovies.filter( title => title !== movieTitle );
        res.status(201).send(`${movieTitle} has been removed from favorites.`);
    } else { 
        res.status(400).send('The movie could not be removed.');
    }
});

// Allow existing users to deregister (showing only a text that a user email has been removed—more on this later).
app.delete('/users/:id', (req, res) => {
    const { id } = req.params;

    let user = users.find( user => user.id == id );

    if (user) {
        users = users.filter( user => user.id != id );
        res.status(201).send(`User with the ID: ${id} has been deleted.`);
    } else { 
        res.status(400).send('User does not exist.');
    }
});

// log all application-level errors to the terminal.
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});