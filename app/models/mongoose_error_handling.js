// Takes in mongoose error argument and returns error descriptor
module.exports.error_descriptor = function(err) {
    console.log(err);
    var objKeys = Object.keys(err.errors);
    var fields = {};
    var member;
    var returnobj = {
        success: false,
        message:  ""
    };

    // Construct object with fields and information on field
    for(var i = 0; i < objKeys.length;  i++) {
        member = objKeys[i];
        returnobj.message += ' ' + err.errors[member].message + '.';
    }

    return returnobj;
};
