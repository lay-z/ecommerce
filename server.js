/**
 *
 * Created by priyav on 14/07/15.
 */
var express = require('express'),
    config = require('./config/config'),
    db = require('./app/initDB').init(),
    routes = require('./app/routes/export.routes').routes,
    path = require('path'),
    passport = require('passport'),
    morgan = require('morgan'),
    static_folder = (path.join(__dirname, 'global'));

// Initialise passport middleware
//require("./app/passport")();

// Initialize application
var app = express(db);

// Places middleware - automatically servers static files that exist
// Within static_folder
// Can place multiple statics
app.use(express.static(static_folder));
//app.use(passport)
app.use(morgan('combined'));

// Set up authentication strategies
require('./app/passport').initialize();

// Set up Routes for app
routes(app);


app.listen(config.port);


// Expose app for testing purposes
exports = module.exports = app;
