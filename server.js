/**
 *
 * Created by priyav on 14/07/15.
 */
var express = require('express'),
    config = require('./config/config'),
    db = require('./app/initDB').init(),
    routes = require('./app/routes/export.routes').routes,
    path = require('path'),
    static_folder = (path.join(__dirname, 'global'));

// Initialize application
var app = express(db);

// Places middleware - automatically servers static files that exist
// Within static_folder
// Can place multiple statics
app.use(express.static(static_folder));
//app.use(body_parser.urlencoded({ 'extended': false}))


// Set up Routes for app
routes(app);


app.listen(config.port);


// Expose app for testing purposes
exports = module.exports = app;
