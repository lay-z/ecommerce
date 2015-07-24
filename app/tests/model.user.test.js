process.env.NODE_ENV = 'test';

console.log("Connecting to DB through model.user.test.js");
require('../../app/initDB').init();
var mongoose = require('mongoose'),
    should = require('chai').should(),
    User = mongoose.model('User');

// Global User for use in functions
var user;

// Begin tests
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
        done();
    });

    after(function(done) {
        console.log("in after block");
        mongoose.disconnect(done);
    });


    describe('#save', function() {
        it('should save User into empty database', function (done) {
            new User(user).save(done);
        });

        it("Shouldn't be able to save with invalid email address", function(done){
            user.email = "invalidEmailAddress.com";
            new User(user).save(function(err) {
                err.should.exist;
                done()
            });
        });
    });
});
