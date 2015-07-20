/**
 * Created by priyav on 18/07/15.
 */

//  Initiazlises all mongoose models
var models = ['user.model.js', 'ripple.model.js'];

exports.initialize = function() {
    var l = models.length;
    for (var i = 0; i < l; i++) {
        require("./"+models[i]);
    }
};