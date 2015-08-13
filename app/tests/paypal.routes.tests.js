/**
 * Created by priyav on 11/08/15.
 */

var chai = require('chai'),
    should = chai.should(),
    server = require('../../server'),
    request = require('supertest')(server),
    mongoose = require('mongoose'),
    async = require('async'),
    User = mongoose.model('User'),
    Ripple_Account = mongoose.model('Ripple_Account');


describe("Paypal api", function() {

    describe("Verifying Users", function() {
        var verified_paypal_email = "priyav-bank@gmail.com";
        var unverified_paypal_email = "pmoney-test@gmail.com";

        it("Should return an error if paypal account has not been verified", function(done) {

        })

    })
});