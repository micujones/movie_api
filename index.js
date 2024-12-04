const express = require('express'),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path');

const app = express();
// create a write stream (in append mode)
// a 'log.txt' file is created in the root directory
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'});

// set up the logger
app.use(morgan('combined', {stream: accessLogStream}));

// array of top ten favorite movies
let topTen = [
    {
        title: 'Transformers',
        releaseYear: 2007,
        director: 'Michael Bay'
    },
    {
        title: 'Captain America: Civil War',
        releaseYear: 2016,
        director: ['Anthony Russo', 'Joe Russo']
    },
    {
        title: 'How the Grinch Stole Christmas',
        releaseYear: 2000,
        director: 'Ron Howard'
    },
    {
        title: 'Zootopia',
        releaseYear: 2016,
        director: ['Byron Howard', 'Rich Moore']
    },
    {
        title: 'The Incredibles',
        releaseYear: 2004,
        director: 'Brad Bird'
    },
    {
        title: 'The Pink Panther',
        releaseYear: 2006,
        director: 'Shawn Levy'
    },
    {
        title: 'Shrek',
        releaseYear: 2001,
        director: ['Andrew Adamson', 'Vicky Jenson']
    },
    {
        title: 'Everything Everywhere All At Once',
        releaseYear: 2022,
        director: ['Daniel Scheinert', 'Daniel Kwan']
    },
    {
        title: 'Bullet Train',
        releaseYear: 2022,
        director: 'David Leitch'
    },
    {
        title: 'They Cloned Tyrone',
        releaseYear: 2023,
        director: 'Juel Taylor'
    }
]


app.use('/documentation', express.static('public'));


app.get('/', (req, res) => {
  res.send('Welcome to my app!');
});

app.get('/movies', (req, res) => {
  res.json(topTen);
});

// log all application-level errors to the terminal.
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});