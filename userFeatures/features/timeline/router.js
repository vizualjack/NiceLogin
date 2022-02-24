var express = require('express');
var router = express.Router();
const path = require('path');

const Database = require('../../database');
let database = new Database();

router.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
});

router.post("/create", function(req, res) {

});

router.post("/get", function(req, res) {
    
});

router.post("/remove", function(req, res) {
    
});


module.exports = router;