const mongoose = require('mongoose');

var DatabaseInstance = null;
class Database {
    constructor() {
        if(DatabaseInstance) return DatabaseInstance;

        DatabaseInstance = this;
        mongoose.connect("mongodb://127.0.0.1:27017/nicelogin");

        this.User = mongoose.model('User', {
            username: String,
            password: String,
            secret: String,
            secretVerified: Boolean
        });
    
        this.Check = mongoose.model('Check', {
            userHex: String,
            text: String,
            checked: Boolean
        })
    }
}

module.exports = Database;