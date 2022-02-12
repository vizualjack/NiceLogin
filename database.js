const mongoose = require('mongoose');

async function MyObject(address) {
    this.address = address;
    await mongoose.connect(this.address);
    const userSchema = new mongoose.Schema({
        name: String
    });
    this.User = mongoose.model('User', userSchema);
}

module.exports = MyObject;