
var mongoose = require('mongoose'),
    should = require('chai').should(),
    User = mongoose.model('User');

// Global User for use in functions
var user1, user2, wallet;

// Begin tests
describe('User model', function() {
    beforeEach(function() {
        user1 = {
            first_name: "priyav",
            surname: "user",
            phone_number: "07528149491",
            pin: "036989"
        };

        user2 = {
            first_name: "another",
            surname: "user2",
            phone_number: "07528149491",
            pin: "776589"
        };

        wallet = {
            address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
            secret: "snoPBrXtMeMyMHUVTgbuqAfg1SUTb"
        };

    });

    after(function(done){
        User.remove().exec(done);
    });

    describe('#save', function() {

        it('should save User and ripple account into empty database', function (done) {
            User.save_user_and_wallet(user1, wallet, function(err){
                should.not.exist(err);
                User.findOne({phone_number: user1.phone_number}, function(err, document) {
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

        it("Shouldn't be able to save with invalid phone_number", function(done){
            user1.phone_number = "invalidnumber";
            User.save_user_and_wallet(user1, wallet, function(err) {
                err.should.exist;
                err.should.have.deep.property("success", false);
                done()
            });
        });

        it("Should not be able to save two users with same phone_number", function(done){
           User.save_user_and_wallet(user2, wallet, function(err) {
               err.should.exist;
               err.should.have.deep.property("success", false);
               done()
           })
        });

        it("Should have encrypted ripple secret", function(done) {
            User.findOne({phone_number: user1.phone_number}, function(err, document) {
                should.not.exist(err);
                console.log(document.ripple_account[0].secret)
                should.not.equal(wallet.secret, document.ripple_account[0].secret);
                done();
            });
        });

        it("Should be able to decrypt ripple secret using correct pin", function(done) {
            User.findOne({phone_number: user1.phone_number}, function(err, user) {
                should.not.exist(err);
                user.decryptSecret(user1.pin);
                console.log(user.ripple_account[0].secret)
                should.equal(user.ripple_account[0].secret, wallet.secret);
                done();
            });
        })

        it("Should NOT be able to decrypt ripple secret using incorrect pin", function(done) {
            User.findOne({phone_number: user1.phone_number}, function(err, user) {
                should.not.exist(err);
                user.decryptSecret("776589").should.be.false;
                should.not.equal(user.ripple_account[0].secret, wallet.secret);
                done();
            });
        })
    })
});
