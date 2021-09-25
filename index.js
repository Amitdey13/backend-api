const express = require('express');
const middleware = require('./middleware')
const cors = require("cors")


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors())

app.get('/', (req,res)=>console.log(res.send("Welcome!")))

app.post('/login', middleware.login)

app.post('/signup', middleware.signup)

const port = process.env.PORT || 5000;

app.listen(port, ()=>{console.log(`Server is running at port ${port}`);})