/**
 *
 * Created by priyav on 14/07/15.
 */
var express = require('express'),
    path = require('path'),
    config = require('./config/config'),
    body_parser = require('body-parser'),
    json_parser = body_parser.json(),
    url_parser = body_parser.urlencoded({"extended":false}),
    mongoose = require('mongoose'),
    chalk = require('chalk');


var static_folder = (path.join(__dirname, 'global'));


// Set up connection to database
var db = mongoose.connect(config.db, function(err) {
    if (err) {
        console.error(chalk.red('Could not connect to MongoDB!'));
        console.log(chalk.red(err));
    }
});

// initialise mongoose models
require('./app/models/models').initialize();
var Ripple_Account = mongoose.model('Ripple_Account'),
    User = mongoose.model('User');

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

app.post('/v1/createUser', json_parser, function(req, res) {
    if (!req.body) return res.sendStatus(400);

    var user = new User(req.body);

    // Save User (if error, then return)
    user.save(function (err) {
        if (err) {
            console.log(err);
            res.sendStatus(400);
            return res.end(err)
        }

        Ripple_Account.generate_wallet(function (err, wallet) {
            if (err) return console.log("FUUCK");

            // generate Ripple wallet
            var wallet = new Ripple_Account(wallet);

            // Update the User to also include pointer to ripple wallet
            user.ripple_account = wallet._id;

            wallet.save(function (err) {
                if (err) console.error(err)
            });

            user.save(function (err) {
                if (err) console.error(err)
            })
        });

        res.send("It worked!")
    });
});

app.listen(config.port);
