///**
// * Created by priyav on 22/08/15.
// */
//
//var log_device = require('../controllers/user.controller').log_device,
//    async = require('async');
//
//module.exports.register_device = function(users) {
//    // Takes in an array of users and validates each user
//    // Then appends device id and secret to passed in objects for them to use
//    // For testing purposes
//    var req;
//    var res = function(user) {
//        return {
//            status: function(number) {
//                return {
//                    json: function(response) {
//                        user.error = response;
//                    }
//                }
//            },
//            json: function(response) {
//                user.secret = response.secret;
//                user.id = response.deviceID;
//            }
//        }
//    }
//
//    for (i in users) {
//        req[i] = {
//            body: users[i]
//        }
//        log_device(req, res(users[i]))
//    }
//    return users;
//}