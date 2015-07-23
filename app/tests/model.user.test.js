// Intialize database and models

var mongoose = require('mongoose'),
    config = require('../../config/config.js')


mongoose.connect(config.testdb, function(err) {
    if (err) {
        console.error(chalk.red('Could not connect to MongoDB!'));
        console.log(chalk.red(err));
    }
});

require('../../app/models/models').initialize();
var User = mongoose.model('User');



var user, user2

describe('User', function() {
    beforeEach(function() {
        user = {
            first_name: "priyav",
            surname: "user",
            email: "test@user.com",
            password: "password",
            paypal_account: "test@user.com",
            tel_number: "07528149491",
            ripple_account: null
        };
    });

    afterEach(function(done){
        User.remove().exec();
        done()
    });


    describe('#save', function() {
        it('should save User into empty database', function (done) {
            new User(user).save(done);
        });

        it("Shouldn't be able to save with invalid email address", function(done){
            user.email = "invalidEmailAddress.com"
            new User(user).save(function(err) {
                if(err) done()
                throw new Error();
            });
        });
    });
});
