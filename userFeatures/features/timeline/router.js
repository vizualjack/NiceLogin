var express = require('express');
var router = express.Router();
const path = require('path');

const Database = require('../../database');
let database = new Database();

router.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
});

router.post("/create", async function(req, res) {
    const eventData = req.body;
    let user = await database.User.findOne({ username: req.session.username });
    if(eventData.text === "" || eventData.start >= eventData.end) {
        res.send();
        return;
    }
    let newEvent = database.Event({user: user, text: eventData.text, start: eventData.start, end: eventData.end});
    const eventInDb = await newEvent.save();
    if(eventInDb === newEvent) res.send(eventInDb._id.toHexString());
    else res.send();
});

router.post("/events", async function(req, res) {
    let user = await database.User.findOne({ username: req.session.username });
    let eventsForUser = await database.Event.find({user: user, start: {$gt: req.body.start},end: {$lt: req.body.end}}, ["text", "start", "end"]);
    res.send(eventsForUser);
});

router.post("/delete", async function(req, res) {
    let user = (await database.User.findOne({ username: req.session.username }));
    await database.Event.findOneAndRemove({_id: req.body.eventId, user: user});
    let event = await database.Event.findOne({_id: req.body.eventId, user: user});
    res.send(event == undefined);
});

module.exports = router;