/**
 *
 * Created by priyav on 14/07/15.
 */
var express = require('express'),
    path = require('path'),
    config = require('./config/config'),
    db = require('./app/initDB').init(),
    body_parser = require('body-parser'),
    url_parser = body_parser.urlencoded({"extended":false}),
    //mongoose = require('mongoose'),
    chalk = require('chalk'),
    routes = require('./app/routes/user.routes').routes,
    static_folder = (path.join(__dirname, 'global'));

// Initialize application
var app = express(db);

// Places middleware - automatically servers static files that exist
// Within static_folder
// Can place multiple statics
app.use(express.static(static_folder));
//app.use(body_parser.urlencoded({ 'extended': false}))

app.get('/v1/account/*/getBalance', function(req, res){
    var account = req.url.split('/')[3];
    Ripple_Account.getAccountBalances(account, function(response){
       res.end(response);
    })
});

// Set up Routes for app
routes(app);


app.listen(config.port);


// Expose app for testing purposes
exports = module.exports = app;
