const mongoose = require('mongoose');

class Database {
    constructor(address) {
        mongoose.connect(address);

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

class Singleton {

    constructor() {
        if (!Singleton.instance) {
            Singleton.instance = new Database("mongodb://127.0.0.1:27017/nicelogin");
        }
    }
  
    getInstance() {
        return Singleton.instance;
    }
  
  }

module.exports = Singleton;