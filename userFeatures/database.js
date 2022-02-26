const mongoose = require('mongoose');

var DatabaseInstance = null;
class Database {
    constructor() {
        if(DatabaseInstance) return DatabaseInstance;

        DatabaseInstance = this;
        mongoose.connect(process.env.MONGO_URI);

        this.User = mongoose.model('User', {
            username: String,
            password: String,
            secret: String,
            secretVerified: Boolean
        });
    
        this.Check = mongoose.model('Check', {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            text: String,
            checked: Boolean
        });

        this.Event = mongoose.model('Event',  {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            text: String,
            start: Date,
            end: Date
        });
    }
}

module.exports = Database;