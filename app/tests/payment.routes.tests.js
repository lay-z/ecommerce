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


describe.only("Ripple Payments", function(){
    this.timeout(12000);

    var bank = new Ripple_Account({
        address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        secret: "snoPBrXtMeMyMHUVTgbuqAfg1SUTb"
    });

    var customer1 ={
        first_name: "test",
        surname: "user",
        email: "test@user.com",
        password: "password",
        paypal_account: "test@user.com",
        tel_number: "07528149491"
    };

    var customer1Account = new Ripple_Account({
        address: "rnja8gckAmRZ7VA1VGKVsgthjJhcjaouTS",
        secret: "sh1hMr2ZLTZj21JwCTAiVBrwFNHZ7"
    });

    var customer2 = {
        first_name: "Anothertest",
        surname: "user",
        email: "anothertest@user.com",
        password: "password22",
        paypal_account: "test@user.com",
        tel_number: "07588900698"
    };
    var customer2Account = new Ripple_Account({
        address: "rJvLnRvyWEi1srDY3JA4GUsJd9MVvcYof5",
        secret: "snZ4ZNHuJhJAmpd6e532pUZggXJUm"
    });

    before(function(done) {
        this.timeout(20000)
        // Amounts to send new users
        function payment(add) {
            return {
            currency: "XRP",
            amount: 250,
            payee: add.address
            }
        };
        // Save two users into system
        async.parallel([
            User.save_user_and_wallet.bind(User, customer1, customer1Account),
            //User.save_user_and_wallet.bind(User, customer2, customer2Account),
            bank.send_payment.bind(bank, payment(customer1Account)),
            //bank.send_payment.bind(bank, payment
        ], function(err) {
            if (err) throw err;
            customer1Account.extendTrust(bank.address, done);
        });
    });

    after(function(done) {
        User.remove().exec();
        done();
    });

    it("Should return error object if payee account is not on system", function(done) {
            // Send request out to /v1/user/transfer/:email
            request.post('/v1/user/' + customer1.email + '/transfer')
                .send({
                    payee: customer2.email,
                    amount: "2000",
                })
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(400)
                .end(function(err, res){
                    should.not.exist(err);
                    // validate response
                    res.body.success.should.equal(false);
                    res.body.message.should.equal("Payee is not registered on system");
                    done();
                })
    })

    it("Should return error object if payer is not on system", function(done) {
        request.post('/v1/user/' + customer2.email + '/transfer')
            .send({
                payee: customer1.email,
                amount: "2000",
            })
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(400)
            .end(function(err, res) {
                should.not.exist(err);
                // validate response
                res.body.success.should.equal(false);
                res.body.message.should.equal(
                    "Invalid email address; email address has not been registered"
                );
                done();
            })
    });

    it("Should return correct information if payer has not had account validated", function(done) {
        // create a new user
        request.post('/v1/user/createUser')
            .send(customer2)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                // Send payment from user (unvalidated)
                request.post('/v1/user/' + customer2.email + '/transfer')
                    .send({
                        payee: customer1.email,
                        amount: "2000"
                    })
                    .expect('Content-Type', 'application/json; charset=utf-8')
                    .expect(400)
                    .end(function(err, res) {
                        should.not.exist(err);
                        console.log(res.body);
                        // validate response
                        res.body.success.should.equal(false);
                        res.body.message.should.equal(
                            "The source account does not exist." // TODO change error messages
                        );
                        done();
                    })
            })
    });

    it("Should return correct information if payee has not had account validated", function(done) {
        request.post('/v1/user/' + customer1.email + '/transfer')
            .send({
                payee: customer2.email,
                amount: "2000"
            })
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(400)
            .end(function(err, res) {
                should.not.exist(err);
                // validate response
                res.body.success.should.equal(false);
                res.body.message.should.equal(
                    "Destination does not exist. Send XRP to create it."
                );
                done();
            })
    })

    it("Should return correct information if payer doesn't have enough money to send", function(done) {
       this.timeout(34000);
        /* Setup accounts */
        User.findOne({email: customer2.email}, function(err, user) {

            var options = {
                payee: user.ripple_account[0].address,
                currency: "XRP",
                amount: 250
            };
            console.log(options.payee);
            bank.send_payment(options, function(err, response) {
                if(err) throw err;
                user.ripple_account[0].extendTrust(bank.address, function(err, response) {
                    if (err) throw err;
                    console.log(response)
                    /* Begin actual test */
                    request.post('/v1/user/' + customer1.email + '/transfer')
                        .send({
                            payee: customer2.email,
                            amount: "2000"
                        })
                        .expect('Content-Type', 'application/json; charset=utf-8')
                        //.expect(400)
                        .end(function(err, res) {
                            should.not.exist(err);
                            // validate response
                            console.log(res.body)
                            res.body.success.should.equal(false);
                            res.body.message.should.equal(
                                "Path could not send partial amount. " +
                                "Please ensure that the source_address has sufficient funds " +
                                "(in the source_amount currency, if specified) to execute this transaction."
                            );
                            done();
                        })
                })
            })
        })

    })

    it("Should be able to send money between two accounts that have XRP, " +
        "both trust the bank and payer has enough money", function(done) {
        this.timeout(20000);
        // Set up account1 to have enough money
        bank.send_payment({
            payee: customer1Account.address,
            currency: "KSH",
            amount: 2500,
            issuer: bank.address
        }, function(err, response) {
            if(err) throw err;
            console.log(response);
            /*** begin test ***/
            request.post('/v1/user/' + customer1.email + '/transfer')
                .send({
                    payee: customer2.email,
                    amount: "2000"
                })
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(200)
                .end(function(err, res) {
                    should.not.exist(err);
                    console.log(res.body);
                    // validate response
                    res.body.success.should.equal(true);
                    done();
                })
        })
    })

});
