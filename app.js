require("dotenv").config();
const express = require('express');
const session = require('express-session');
const { rmSync } = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const res = require('express/lib/response');
const speakeasy = require('speakeasy');
const ip = require("ip");

const port = process.env.PORT || 8080;

var app = express();
var userFeatures = require("./userFeatures/router");

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));
app.use("/user", userFeatures);

app.get("/", function(req,res) {
    if(req.session.loggedin) res.redirect("/user")
    else res.redirect("/login");
});

app.route("/login")
    .get(function(req, res) {
        res.sendFile(path.join(__dirname, "login.html"));
    })
    .post(async function(req, res) {
        let loginData = req.body;
        let user = await userFeatures.getUserByUsername(loginData.username);
        if(!user || 
            !bcrypt.compareSync(loginData.password, user.password)) {
                res.writeHead(401, "Username or password was not correct");
            }
        else if(user.secretVerified){
            if(!req.body.token) {
                res.writeHead(401, "Token needed");
            }
            else {
                let verified = speakeasy.totp.verify({
                    secret: user.secret,
                    encoding: "base32",
                    token: req.body.token
                });

                if(!verified) {
                    res.writeHead(401, "Token was not correct");
                }
                else {
                    res.writeHead(200);
                    req.session.loggedin = true;
                    req.session.username = loginData.username;
                }
            }
        }
        else {
            res.writeHead(200);
            req.session.loggedin = true;
            req.session.username = loginData.username;
        }
        res.end();
    });

app.route("/register")
    .get(function(req, res) {
        res.sendFile(path.join(__dirname, "register.html"));
    })
    .post(async function(req, res) {
        let loginData = req.body;
        let user = await userFeatures.getUserByUsername(loginData.username);
        console.log(user);
        if(user) {
            res.writeHead(400, "Username already exists");
        }
        else {
            let hashedPw = bcrypt.hashSync(loginData.password, 10);
            userFeatures.addUser(loginData.username, hashedPw);
            res.writeHead(200);
        }
        res.end();
    });

app.get("*", function(req, res) {
    res.status(404).send('here is nothing');
});

app.listen(port);
console.log("Server started!");
console.log(`Local: http://localhost:${port}`);
console.log(`Network: http://${ip.address()}:${port}`);