
var mongoose = require('mongoose'),
    should = require('chai').should(),
    User = mongoose.model('User');

// Global User for use in functions
var user1, user2, wallet;

// Begin tests
describe('User', function() {
    beforeEach(function() {
        user1 = {
            first_name: "priyav",
            surname: "user",
            email: "test@user.com",
            pin: "036989",
            paypal_account: "test@user.com",
            tel_number: "07528149491"
        };

        user2 = {
            first_name: "another",
            surname: "user2",
            email: "test@user.com",
            pin: "776589",
            paypal_account: "anothertest@user.com",
            tel_number: "07559198901"
        };

        wallet = {
            address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
            secret: "snoPBrXtMeMyMHUVTgbuqAfg1SUTb"
        };

    });

    after(function(done){
        User.remove().exec(done);
    });

    describe.only('#save', function() {

        it('should save User and ripple account into empty database', function (done) {
            User.save_user_and_wallet(user1, wallet, function(err){
                should.not.exist(err);
                User.findOne({email: user1.email}, function(err, document) {
                    should.not.exist(err);

                    var saved_wallet = document.ripple_account[0];
                    saved_wallet.get_balances(function(err, balances){
                        should.not.exist(err);
                        balances.success.should.be.ok;
                        done();
                    });
                })
            });
        });

        it("Shouldn't be able to save with invalid email address", function(done){
            user1.email = "invalidEmailAddress.com";
            User.save_user_and_wallet(user1, null, function(err) {
                err.should.exist;
                err.should.have.deep.property("success", false);
                done()
            });
        });

        it("Should not be able to save two users with same email address", function(done){
               User.save_user_and_wallet(user2, null, function(err) {
                   err.should.exist;
                   err.should.have.deep.property("success", false);
                   done()
           })

        });

        it("Should have produced a hash of saved pin", function(done) {
            User.findOne({email: user1.email}, function(err, document) {
                should.not.exist(err);
                should.not.equal(user1.pin, document.pin);
                done();
            });
        });

        it("Should be able to authenticate user based on non hashed pin", function(done) {
            User.findOne({email: user1.email}, function(err, user) {
                should.not.exist(err);
                user.authenticate(user1.pin).should.be.true;
                done();
            });

        })
    })
});
