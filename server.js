const { generateState, GitHub } = require('arctic');
const express = require('express');
const app = express();
const port = 8080;
const session = require('express-session');
const dotenv = require('dotenv').config();

const gitHub = new GitHub(
    process.env.GITHUB_CLIENT_ID,
    process.env.GITHUB_CLIENT_SECRET,
    'http://localhost:8080/github/callback'
)

app.use(session({
  secret: process.env.SESSION_SECRET,   
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax', 
    maxAge: 1000 * 60 * 60 * 24 
  }
}));



app.get('/',async (req,res)=>{
    const state = generateState();
    const url = await gitHub.createAuthorizationURL(state, ["user:email"]);
    req.session.state = state;
    res.redirect(url.toString());
})




app.listen(port,()=>{
    console.log(`Listening on port ${port}`);  
})