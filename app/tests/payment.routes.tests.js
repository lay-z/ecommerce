/**
 * Created by priyav on 27/07/15.
 */
// Get environment into testing mode!
process.env.NODE_ENV = 'test';

var chai = require('chai'),
    should = chai.should(),
    server = require('../../server'),
    request = require('supertest')(server),
    mongoose = require('mongoose'),
    async = require('async'),
    User = mongoose.model('User'),
    Ripple_Account = mongoose.model('Ripple_Account');


describe.skip("Payments", function(){
    var customer1 ={
        first_name: "test",
        surname: "user",
        email: "test@user.com",
        password: "password",
        paypal_account: "test@user.com",
        tel_number: "07528149491"
    };

    var rootAccount = {
        address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        secret: "snoPBrXtMeMyMHUVTgbuqAfg1SUTb"
    };

    var customer2 = {
        first_name: "Anothertest",
        surname: "user",
        email: "anothertest@user.com",
        password: "password22",
        paypal_account: "test@user.com",
        tel_number: "07588900698"
    };
    var customer2Account = {
        address: "rJvLnRvyWEi1srDY3JA4GUsJd9MVvcYof5",
        secret: "snZ4ZNHuJhJAmpd6e532pUZggXJUm"
    };

    describe("Send XRP between users", function() {
        it("Should be able to send money between users when correct information passed In", function(done) {
            // Save user accounts and wallet
            async.parallel([
                    User.save_user_and_wallet.bind(User, customer1, rootAccount),
                    User.save_user_and_wallet.bind(User, customer2, customer2Account),
            ],
                // Execute after both users have been saved
                function(err) {
                    if(err) throw err;

                    // Send request out to /v1/user/transfer/:email
                    request.post('/v1/user/transfer/' + customer1.email)
                        .send({
                            payee: customer2.email,
                            amount: "2000",
                            currency: "XRP"
                        })
                        .expect(200)
                        .end(function(err, res){
                            // validate response
                            res.body.success.should.equal(true)
                        })
                }
            );
        })
    });

    describe("Send KSH issued out from 'bank' between users", function() {

    });
});
