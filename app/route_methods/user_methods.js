//var Ripple_Account = require('')

module.exports.save_user = function(req, res) {
    if (!req.body) return res.sendStatus(400);

    var user = new User(req.body);

    // Save User (if error, then return)
    user.save(function (err) {
        if (err) {
            console.log(err);
            res.sendStatus(400);
            return res.end(err)
        }

        Ripple_Account.generate_wallet(function (err, wallet) {
            if (err) return console.log("FUUCK");

            // generate Ripple wallet
            var wallet = new Ripple_Account(wallet);

            // Update the User to also include pointer to ripple wallet
            user.ripple_account = wallet._id;

            wallet.save(function (err) {
                if (err) console.error(err)
            });

            user.save(function (err) {
                if (err) console.error(err)
            })
        });

        res.send("It worked!")
    });
}
