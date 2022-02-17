var express = require('express');
var router = express.Router();
const path = require('path');

const Database = require('../../database');
let database = new Database();


router.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
});

router.post("/create", async function(req, res) {
    let user = await database.User.findOne({ username: req.session.username });
    let newCheck = database.Check({userHex: user._id.toHexString(), text: req.body.text});
    const checkInDb = await newCheck.save();
    return checkInDb === newCheck;
});

router.post("/changeStatus", function(req, res) {

});

router.get("/checks", async function(req, res) {
    let user = await database.User.findOne({ username: req.session.username });
    let checksForUser = await database.Check.find({userHex: user._id.toHexString()});
    res.send(checksForUser);
});

module.exports = router;