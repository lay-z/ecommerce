// Takes in mongoose error argument and returns error descriptor
module.exports.error_descriptor = function(err) {
    console.log(err);
    var objKeys = Object.keys(err.errors);
    var fields = {};
    var member;

    // Construct object with fields and information on field
    for(var i = 0; i < objKeys.length;  i++) {
        member = objKeys[i];
        fields[member] = err.errors[member].message;
    }

    return {
        success: false,
        error: {
            message: err.message,
            fields: fields
        }
    }
};
