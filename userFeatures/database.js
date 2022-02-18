const mongoose = require('mongoose');

var DatabaseInstance = null;
class Database {
    constructor() {
        if(DatabaseInstance) return DatabaseInstance;

        DatabaseInstance = this;
        mongoose.connect(process.env.MONGO_URI, {
            dbName: process.env.DB_NAME
        });

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