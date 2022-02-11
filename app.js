const express = require('express');
const session = require('express-session');
const { rmSync } = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const res = require('express/lib/response');

const app = express();

const users = {};


app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, 'static')));

app.get("/", function(req, res) {
    if(req.session.loggedin) 
        res.sendFile(path.join(__dirname, "index.html"));
    else
        res.redirect("login"); 
});

app.post("/logout", function(req, res) {
    // delete users[req.session.username];
    if(users[req.session.username])  {
        delete req.session.username;
        req.session.loggedin = false;
        res.writeHead(200);
    }
    else {
        res.writeHead(400, "Not logged out!");
    }
    res.end();
});

app.get("/login", function(req, res) {
    res.sendFile(path.join(__dirname, "login.html"));
});

app.post("/login", function(req, res) {
    let loginData = req.body;
    if(!users[loginData.username] || 
        !bcrypt.compareSync(loginData.password, users[loginData.username].password)) {
            res.writeHead(400, "Username or password was not correct");
        }
    else if(users[loginData.username].secretVerified){
        if(!req.body.token) {
            res.writeHead(400, "Token needed");
        }
        else {
            let verified = speakeasy.totp.verify({
                secret: users[loginData.username].secret,
                encoding: "base32",
                token: req.body.token
            });

            if(!verified) {
                res.writeHead(400, "Token was not correct");
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

app.get("/register", function(req, res) {
    res.sendFile(path.join(__dirname, "register.html"));
});

app.post("/register", function(req, res) {
    let loginData = req.body;
    if(users[loginData.username] != undefined) {
        res.writeHead(400, "Username already exists");
    }
    else {
        let hashedPw = bcrypt.hashSync(loginData.password, 10);
        users[loginData.username] = {};
        users[loginData.username].password = hashedPw;
        res.writeHead(200);
    }
    res.end();
});

app.get("/genTwoFactor", function(req, res) {
    if(req.session.loggedin) {
        let secret = speakeasy.generateSecret({
            name: "NiceLogin",
        }); 
        users[req.session.username].secret = secret.base32;
        qrcode.toDataURL(secret.otpauth_url, (err, qrcode) => {
            res.redirect(qrcode);
            res.end();
        });
    }
    else {
        res.writeHead(404);
        res.end();
    }
});

app.get("/twoFactor", function(req, res) {
    if(req.session.loggedin) {
        res.sendFile(path.join(__dirname, "twoFactor.html"));
    }
    else {
        res.redirect("login");
    }
});

app.post("/twoFactor", function(req, res) {
    if(req.session.loggedin) {
        let verified = speakeasy.totp.verify({
            secret: users[req.session.username].secret,
            encoding: "base32",
            token: req.body.token
        });

        if(verified) users[req.session.username].secretVerified = true;
        res.send(verified);
    }
    else {
        res.writeHead(404);
        res.end()
    }
});

app.listen(8080)