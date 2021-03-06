var express = require('express');
var router = express.Router();
const path = require('path');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const Database = require('./database');
let database = new Database();

var checklist = require("./features/checklist");
var timeline = require("./features/timeline");

router.addUser = async function (username, password) {
    let user = database.User({username: username, password: password});
    const newUser = await user.save();
    return newUser === user;
}

router.getUserByUsername = async function (username) {
    let user = await database.User.findOne({ username: username });
    return user;
}

router.use(function checkLoggedIn(req, res, next) {
    if(!req.session.loggedin) res.sendStatus(401);
    else next();
});

router.use("/checklist", checklist);
router.use("/timeline", timeline);

router.get("/info", function(req, res) {
    res.send({username: req.session.username});
});

router.post("/logout", function(req, res) {
    delete req.session.username;
    req.session.loggedin = false;
    res.writeHead(200);
    res.end();
});

router.get("/genTwoFactor", async function(req, res) {
    let user = await router.getUserByUsername(req.session.username);
    if(!user.secretVerified) {
        let secret = speakeasy.generateSecret({
            name: "NiceLogin",
        }); 
        user.secret = secret.base32;
        user.save();
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

router.post("/twoFactor", async function(req, res) {
    let user = await router.getUserByUsername(req.session.username);
    if(!user.secretVerified) {
        let verified = speakeasy.totp.verify({
            secret: user.secret,
            encoding: "base32",
            token: req.body.token
        });

        if(verified) {
            user.secretVerified = true;
            user.save();
        }
        res.send(verified);
    }
    else {
        res.writeHead(404);
        res.end()
    }
});

module.exports = router;