var express = require('express');
var router = express.Router();
const path = require('path');

const Database = require('../../database');
let database = new Database().getInstance();


router.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
});

router.post("/create", function(req, res) {

});

router.post("/changeStatus", function(req, res) {

});

router.get("/checks", async function(req, res) {
    let user = await database.User.findOne({ username: req.session.username });
    // console.log(user._id.toHexString());
    res.send("test");
});

module.exports = router;