process.env.NODE_ENV = 'test';

var should = require('chai').should(),
    user_methods = require('../../app/route_methods/user_methods'),
    server = require('../../server'),
    request = require('supertest')(server),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Ripple_Account = mongoose.model('Ripple_Account');

// Global objects
var user, user2;
describe('Routes', function() {
    describe('user_methods', function() {

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
            user2.email = "user2@mail.com"
            request.post('/v1/user/createUser')
                .send(user2)
                .end(function(err, res) {
                    if(err || (res.body.success === false)) throw err;
                    User.findOne({email: user2.email}, function(err, document) {
                        Ripple_Account.findById(document.ripple_account, function(err, document) {
                            document.should.have.deep.property("address");
                            document.should.have.deep.property("secret");
                            done();
                        })
                    })
                })
        })

        it("Should be able to ")

    });
});
