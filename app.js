const express = require('express');
const session = require('express-session');
const { rmSync } = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

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
    delete users[req.session.username];
    if(users[req.session.username] == undefined)  {
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
    if(users[loginData.username] == undefined || 
        !bcrypt.compareSync(loginData.password, users[loginData.username])) {
            res.writeHead(400, "Username or password was not correct");
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
        console.log(hashedPw);
        users[loginData.username] = hashedPw;
        res.writeHead(200);
    }
    res.end();
});

app.get("/qr", (req, res) => {
    const secret = speakeasy.generateSecret();
    console.log(secret);
    qrcode.toDataURL(secret.otpauth_url, (err, qrcode) => {
        res.writeHead(200, "Success", {
            "Content-Type": "image/png"
        });
        res.send(qrcode);
    });
});

app.listen(8080)