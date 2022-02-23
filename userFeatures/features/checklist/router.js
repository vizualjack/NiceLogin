var express = require('express');
var router = express.Router();
const path = require('path');

const Database = require('../../database');
let database = new Database();

async function getCheckForUsername(username) {
}

router.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
});

router.post("/create", async function(req, res) {
    let user = await database.User.findOne({ username: req.session.username });
    let newCheck = database.Check({userHex: user._id.toHexString(), text: req.body.text, checked: false});
    const checkInDb = await newCheck.save();
    if(checkInDb === newCheck) res.send(checkInDb._id.toHexString());
    else res.send(null);
});

router.post("/changeStatus", async function(req, res) {
    let userHex = (await database.User.findOne({ username: req.session.username }))._id.toHexString();
    let check = await database.Check.findOne({_id: req.body.checkId, userHex: userHex});
    if(check) {
        check.checked = !check.checked;
        await check.save();
    }
    res.send(check != undefined);
});

router.post("/delete", async function(req, res) {
    let userHex = (await database.User.findOne({ username: req.session.username }))._id.toHexString();
    await database.Check.findOneAndRemove({_id: req.body.checkId, userHex: userHex});
    let check = await database.Check.findOne({_id: req.body.checkId, userHex: userHex});
    res.send(check == undefined);
});

router.get("/checks", async function(req, res) {
    let user = await database.User.findOne({ username: req.session.username });
    let checksForUser = await database.Check.find({userHex: user._id.toHexString()},["text", "checked"]);
    res.send(checksForUser);
});

module.exports = router;