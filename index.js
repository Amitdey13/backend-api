const express = require('express');
const middleware = require('./middleware')

const app = express();

app.get('/', (req, res) => res.send("Welcome!"))
app.get('/login', middleware.login)

app.get('/signup', middleware.signup)

const port = process.env.PORT || 5000;

app.listen(port)