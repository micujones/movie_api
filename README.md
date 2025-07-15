# Movie API

A server-side component for a movies web application. The web
application will provide users with access to information about different
movies, directors, and genres. Users will be able to sign up, update their
personal information, and create a list of their favorite movies

## Features

-   Return a list of all available movies to the user
-   Return data (description, genre, director, image URL, whether it’s featured or not) about a single movie via title to the user
-   Return data about a genre (description) via name (e.g., “Thriller”)
-   Return data about a director (bio, birth year, death year) via name
-   Allow new users to register
-   Allow existing users to deregister
-   Allow users to:
    -   update their user info (username, password, and email)
    -   add a movie to their list of favorites
    -   remove a movie from their list of favorites
    -   see which actors star in which movies

## Tools

-   Node.js
-   Express
-   Heroku
-   MongoDB
-   Mongoose
-   Postman

## Installation

1. Clone the repo
    ```sh
    gh repo clone micujones/movie_api
    ```
2. Install NPM packages
    ```sh
    npm install
    ```

## Usage

Add a local `.env` file and add a custom `JWT_SECRET`. Replace `your_jwt_secret` with your own generated secret.

```js
JWT_SECRET = your_jwt_secret;
```

Update the `allowedOrigins` in `index.js` to incorporate your work environment.

```js
let allowedOrigins = [
    'http://localhost:8080',
    ...
];
```

To use a personal database of movies, [install mongodb](https://www.mongodb.com/docs/manual/installation/) and then [install mongosh](https://www.mongodb.com/docs/mongodb-shell/install/). Connect mongoose with the following:

```js
mongoose.connect('mongodb://127.0.0.1:27017/YourDatabaseNameHere');
```
