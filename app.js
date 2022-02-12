const express = require('express');
const session = require('express-session');
const { rmSync } = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const res = require('express/lib/response');
const speakeasy = require('speakeasy');


var app = express();
var userFeatures = require("./userFeatures");

async function testDB() {
    const Database = require("./database");
    var database = await Database("mongodb://127.0.0.1:27017/test");
    var testUser = new database.User({
        name: "Test"
    });
    await testUser.save();
}

testDB();


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
    .post(function(req, res) {
        let loginData = req.body;
        if(!userFeatures.users[loginData.username] || 
            !bcrypt.compareSync(loginData.password, userFeatures.users[loginData.username].password)) {
                res.writeHead(401, "Username or password was not correct");
            }
        else if(userFeatures.users[loginData.username].secretVerified){
            if(!req.body.token) {
                res.writeHead(401, "Token needed");
            }
            else {
                let verified = speakeasy.totp.verify({
                    secret: userFeatures.users[loginData.username].secret,
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
    .post(function(req, res) {
        let loginData = req.body;
        if(userFeatures.users[loginData.username] != undefined) {
            res.writeHead(400, "Username already exists");
        }
        else {
            let hashedPw = bcrypt.hashSync(loginData.password, 10);
            userFeatures.users[loginData.username] = {};
            userFeatures.users[loginData.username].password = hashedPw;
            res.writeHead(200);
        }
        res.end();
    });

app.get("*", function(req, res) {
    res.status(404).send('here is nothing');
});

app.listen(8080)