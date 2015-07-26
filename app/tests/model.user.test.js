process.env.NODE_ENV = 'test';

console.log("Connecting to DB through model.user.test.js");
require('../../app/initDB').init();
var mongoose = require('mongoose'),
    should = require('chai').should(),
    User = mongoose.model('User');

// Global User for use in functions
var user, user2;

// Begin tests
describe('User', function() {
    beforeEach(function() {
        user = {
            first_name: "priyav",
            surname: "user",
            email: "test@user.com",
            password: "password",
            paypal_account: "test@user.com",
            tel_number: "07528149491"
        };

        user2 = {
            first_name: "another",
            surname: "user2",
            email: "test@user.com",
            password: "password2",
            paypal_account: "anothertest@user.com",
            tel_number: "07559198901"
        };

    });

    afterEach(function(done){
        User.remove().exec();
        done();
    });

    describe('#save', function() {
        it('should save User into empty database', function (done) {
            User.save_user_and_wallet(user, null, done);
        });

        it("Shouldn't be able to save with invalid email address", function(done){
            user.email = "invalidEmailAddress.com";
            User.save_user_and_wallet(user, null, function(err) {
                err.should.exist;
                err.should.have.deep.property("success", false);
                done()
            });
        });

        it("Should not be able to save two users with same email address", function(done){
           User.save_user_and_wallet(user, null, function(err){
               if (err) done(err);

               User.save_user_and_wallet(user2, null, function(err) {
                   err.should.exist;
                   err.should.have.deep.property("success", false);
                   done()
               });
           })
        })
    });
});
