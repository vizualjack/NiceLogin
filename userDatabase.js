const mongoose = require('mongoose')
module.exports = function(address) {
    mongoose.connect(address);
    this.User = mongoose.model('User', {
        username: String,
        password: String,
        secret: String,
        secretVerified: Boolean
    });
};