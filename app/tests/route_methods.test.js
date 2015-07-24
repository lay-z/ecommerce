process.env.NODE_ENV = 'test';

var should = require('chai').should(),
    user_methods = require('../../app/route_methods/user_methods'),
    server = require('../../server'),
    request = require('supertest')(server),
    mongoose = require('mongoose');


describe('Routes', function() {

    after(function(done) {
        console.log("in after block");
        mongoose.disconnect(done)
    });

    describe('user_methods', function() {
       /* it("should return bad request 400 if body is not JSON formatted/Doesn't contain correct info", function(done) {
            request
                .post('/createUser')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send({})
                .expect(400, done);

        });*/
    });
});
