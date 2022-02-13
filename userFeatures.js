var express = require('express');
var router = express.Router();
const path = require('path');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const UserDatabase = require('./userDatabase');
let userDatabase = new UserDatabase("mongodb://127.0.0.1:27017/nicelogin");


router.addUser = async function (username, password) {
    let user = userDatabase.User({username: username, password: password});
    const newUser = await user.save();
    return newUser === user;
}

router.getUserByUsername = async function (username) {
    return await userDatabase.User.findOne({ username: username });
}


router.use(function checkLoggedIn(req, res, next) {
    if(!req.session.loggedin) next('router');
    else next();
});

router.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "user.html"));
});

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

router.route("/twoFactor")
    .get(async function(req, res) {
        let user = await router.getUserByUsername(req.session.username);
        if(!user.secretVerified) {
            res.sendFile(path.join(__dirname, "twoFactor.html"));
        }
        else {
            res.redirect("/");
        }
    })
    .post(async function(req, res) {
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