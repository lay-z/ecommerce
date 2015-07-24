/**
 * Created by priyav on 24/07/15.
 */

var config = require('../config/config.js'),
    chalk = require('chalk'),
    mongoose = require('mongoose');

// set environment to test
module.exports.init = function() {

    // Check if already connected to db
    if (mongoose.connection.readyState) {
        console.log(chalk.red("Connection already established"));
        return;
    }
    var db = mongoose.connect(config.db, function(err) {
        if (err) {
            console.error(chalk.red('Could not connect to MongoDB!'));
            console.log(chalk.red(err));
        }
    });

    // Intialize database and models
    require('../app/models/models').initialize();

    return db;
}