const express = require('express');
const middleware = require('./middleware')

const app = express();

app.get('/', (req, res) => res.send("Welcome!"))
app.get('/login', middleware.login)

app.get('/signup', middleware.signup)

app.listen(4000)