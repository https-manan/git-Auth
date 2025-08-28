const { generateState, GitHub } = require('arctic');
const { default: axios } = require('axios');
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


app.get('/github/callback',async (req,res)=>{
    const {code,state} = req.query;
    const cookieState = req.session.state;
    if(state!=cookieState){
        alert('Unauthorized aascess');
    }
    try {
        const token = await gitHub.validateAuthorizationCode(code);
    } catch (error) {
        console.log(error)
    }

    const gitHubUserRes = await axios.get('https://api.github.com/user',{
        headers:{
            Authorization:`Bearer${token.ascessToken()}`
        }
    });
    if(!gitHubUserRes.ok){alert('No response')}
    const gitHubUser = gitHubUserRes.json();
    const {id:gitHubUserId,name} = gitHubUser;

    const gitHubEmailRes = await axios.get('https://api.github.com/user/emails', {
    headers: {
        Authorization: `Bearer ${token.accessToken()}`
    }
  });

    const emails = gitHubEmailRes.data; 
    const primaryEmail = emails.find(e => e.primary)?.email;

    //3 conditions
    //1st when the user exists and is registed with gitAUth
    const user = await getUserWithOauthId({
        provider:'github',
        email,
    });

    //2nd when the user exists but not registered with gitAuth
    if(user && !user.providerAccountId){
        await linkUserWithOauth({
            userId:user.id,
            provider:'github',
            providerAccountId:gitHubUserId
        })
    }
})


app.listen(port,()=>{
    console.log(`Listening on port ${port}`);  
})