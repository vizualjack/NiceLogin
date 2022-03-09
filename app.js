require("dotenv").config();
const express = require('express');
const http = require('http');
const https = require('https');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const res = require('express/lib/response');
const speakeasy = require('speakeasy');
const ip = require("ip");
const httpPort = process.env.HTTP_PORT || 8080;


var app = express();
var userFeatures = require("./userFeatures/router");

// app.use(function logRequest(req, res, next) {
//     console.log(req.originalUrl);
//     next();
// });

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

app.use(function checkForHtmlRequest(req, res, next) {
    if(req.accepts("text/html")) res.sendFile(path.join(__dirname, "static/index.html"));
    else next();
});

app.use("/user", userFeatures);

app.post("/login", async function(req, res) {
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

app.post("/register", async function(req, res) {
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

if(process.env.HTTPS_CERT === '') {
    var httpServer = http.createServer(app);
    httpServer.listen(httpPort);
    console.log("Server started!");
    console.log(`Local: http://localhost:${httpPort}`);
    console.log(`Network: http://${ip.address()}:${httpPort}`);    
}
else {
    var redirectApp = express();
    redirectApp.all("/*", function(req, res) {
        res.redirect("https://" + req.hostname + req.url);
    });
    var httpServer = http.createServer(redirectApp);
    httpServer.listen(httpPort);

    var privateKey  = fs.readFileSync(process.env.HTTPS_PRIV_KEY, 'utf8');
    var certificate = fs.readFileSync(process.env.HTTPS_CERT, 'utf8');
    const httpsPort = process.env.HTTPS_PORT || 8443;
    var credentials = {key: privateKey, cert: certificate};
    var httpsServer = https.createServer(credentials, app);
    httpsServer.listen(httpsPort);
    console.log("Secured server started!");
    console.log(`Local: http://localhost:${httpsPort}`);
    console.log(`Network: http://${ip.address()}:${httpsPort}`);
}