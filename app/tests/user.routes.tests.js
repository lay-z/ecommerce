var chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    user_methods = require('../../app/route_methods/user_methods'),
    server = require('../../server'),
    request = require('supertest')(server),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Ripple_Account = mongoose.model('Ripple_Account');

// chai-things used for validating arrays
chai.use(require('chai-things'));



describe('User routes', function() {

    describe('Saving user and account', function() {
        // Used for validating saved users and accounts
        var user, user2;

        beforeEach(function(){
            user = {
                first_name: "test",
                surname: "user",
                email: "test@user.com",
                password: "password",
                paypal_account: "test@user.com",
                tel_number: "07528149491"
            };

            user2 = {
                first_name: "test2",
                surname: "user2",
                email: "test@user.com",
                password: "password22",
                paypal_account: "another@user.com",
                tel_number: "0778900700"
            };
        });

        after(function(done) {
            console.log("removing all users and accounts from test db");
            User.remove().exec();
            Ripple_Account.remove().exec();
            done();
        })

       it("should return bad request 400 if body is not JSON formatted", function(done) {
           //console.log(request);
            request.post('/v1/user/createUser')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send({})
                .expect(400, function(err, res){
                    res.body.should.have.deep.property("success", false);
                    done();
                });
        });

        it("should return bad request 400 & correct error info if body doesn't contain necessary info", function(done) {
            request.post('/v1/user/createUser')
                .send({})
                .expect(400)
                .end(function(err, res){
                    res.body.should.have.deep.property("success", false)
                    res.body.should.have.deep.property("error.fields.tel_number");
                    res.body.should.have.deep.property("error.fields.email");
                    res.body.should.have.deep.property("error.fields.surname");
                    res.body.should.have.deep.property("error.fields.first_name");
                    res.body.should.have.deep.property("error.fields.password");
                    done();
                });
        });

        it("Should save user when correct information is sent", function(done){
            request.post('/v1/user/createUser')
                .send(user)
                .expect(200)
                .end(function(err, res) {
                    res.body.should.have.deep.property("success", true);
                    User.findOne({email: user.email}, done);
                });
        });

        it("Should return error when user tries to create account with email already in use", function(done){
            request.post('/v1/user/createUser')
                .send(user2)
                .expect(400)
                .end(function(err, res){
                    if(err) throw err;
                    res.body.should.have.deep.property("success", false);
                    done();
                })
        });

        it("Should generate and save ripple account when creating account if none is provided", function(done) {
            user2.email = "user2@mail.com"; // Create unique email address
            request.post('/v1/user/createUser')
                .send(user2)
                .end(function(err, res) {
                    if(err || (res.body.success === false)) throw new Error();
                    User.findOne({email: user2.email}, function(err, document) {
                        if(err) throw err;
                        document.ripple_account.should.contain.a.thing.with.a.property("address")
                        document.ripple_account.should.contain.a.thing.with.a.property("secret")
                        done();
                    })
                })
        });

    });

    describe('Getting user account information', function() {

        // Master account information
        var master_account = new Ripple_Account({
            address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
            secret: "snoPBrXtMeMyMHUVTgbuqAfg1SUTb"
        });
        var ripple_account;

        var user = {
            first_name: "test",
            surname: "user",
            email: "test@user.com",
            password: "password",
            paypal_account: "test@user.com",
            tel_number: "07528149491"
        };

        // Set up User and wallet in db
        before(function(done){
            // Gives set up enough time to complete transactions
            this.timeout(5500);
            Ripple_Account.generate_wallet(function(err, wallet) {
                ripple_account = wallet;

                User.save_user_and_wallet(user, ripple_account, function(){});
                // Send XRP to account
                master_account.send_payment({currency: "XRP", amount: 250,
                    payee: ripple_account.address}, done);
            })
        });

        after(function() {
            User.remove().exec();
            Ripple_Account.remove().exec();
        });


       it("Should send empty array of balances if user exists but has not deposited any money", function(done){

            // Make get request to /v1/user/:email
            request.get('/v1/user/' + user.email)
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(200)
                .end(function(err, res) {
                    if(err) throw err;
                    res.body.should.have.deep.property("success", true);
                    res.body.balances.should.be.empty;
                    done();
                });
       });

        /*
        it("Should return error object if request called with incorrect headers", function(done) {
            // Send get request where content-type == HTML(?)

            // Check that returned object has:
            //      Success:false field
            //      More error information
        }); */

        /*
        TODO
       it("Should return correct balance of issued out ksh")

         */

        it("Should return correct error object if account wallet has not yet been activated", function(done) {
            var correctError = {
                success: false,
                message: "User Account has not yet been validated"
            };
            // Create new user with generated ripple address
            user.email = "newemail@gmail.com";
            // Generate and then save wallet and user (but not validated wallet)
            Ripple_Account.generate_wallet(function(err, wallet) {
                if (err) throw err;

                User.save_user_and_wallet(user, wallet, function(err) {
                    if (err) throw err;

                    request.get('/v1/user/' + user.email)
                        .expect('Content-Type', 'application/json; charset=utf-8')
                        .expect(500)
                        .end(function(err, res) {
                            if(err) throw err;
                            res.body.should.deep.equal(correctError)
                            done();
                        })
                    })
                });
        });

        it("Should return error object if request called for user that doesn't exist", function(done){
            var accountNotValidError = {
                success: false,
                message: "Invalid email address; email address has not been registered"
            };

            // Send get request for user that doesn't exist
            request.get('/v1/user/notUser@nonexistantmail.com')
                .expect('Content-Type', 'application/json; charset=utf-8')
                .expect(400)
                .end(function(err, res) {
                    if(err) throw err;
                    res.body.should.deep.equal(accountNotValidError);
                    done();
                });
        });

    });

    //TODO describe('Updating user account information')

});