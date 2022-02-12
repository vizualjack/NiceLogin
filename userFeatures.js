var express = require('express');
var router = express.Router();
const path = require('path');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

router.users = {};

router.use(function checkLoggedIn(req, res, next) {
    if(!req.session.loggedin) next('router');
    else next();
});

router.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "user.html"));
});

router.post("/logout", function(req, res) {
    if(router.users[req.session.username])  {
        delete req.session.username;
        req.session.loggedin = false;
        res.writeHead(200);
    }
    else {
        res.writeHead(400, "Not logged out!");
    }
    res.end();
});

router.get("/genTwoFactor", function(req, res) {
    if(!router.users[req.session.username].secretVerified) {
        let secret = speakeasy.generateSecret({
            name: "NiceLogin",
        }); 
        router.users[req.session.username].secret = secret.base32;
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

router.route("/twoFactor")
    .get(function(req, res) {
        if(!router.users[req.session.username].secretVerified) {
            res.sendFile(path.join(__dirname, "twoFactor.html"));
        }
        else {
            res.redirect("/");
        }
    })
    .post(function(req, res) {
        if(!router.users[req.session.username].secretVerified) {
            let verified = speakeasy.totp.verify({
                secret: router.users[req.session.username].secret,
                encoding: "base32",
                token: req.body.token
            });

            if(verified) router.users[req.session.username].secretVerified = true;
            res.send(verified);
        }
        else {
            res.writeHead(404);
            res.end()
        }
    });

module.exports = router;