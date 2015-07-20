//var ripple_methods = require('./ripple_methods');
//var account1 = 'rwy8vJNsfFW8SLguKB9YcPBsRbtvnhiMv4'
//var account2 = 'rJvLnRvyWEi1srDY3JA4GUsJd9MVvcYof5'
//
//var rippleObj = {
//    "accountFrom": account2,
//    "accountTo": account1,
//    "secret": 'snZ4ZNHuJhJAmpd6e532pUZggXJUm',
//    "amount": 10,
//    "currency": "KSH"
//}
//
//ripple_methods.getAccountBalances(account1, function(err, body){
//    if(err) return console.log(err)
//
//    console.log(body)
//    ripple_methods.getAccountBalances(account2, function(err, body) {
//        if(err) return console.log(err)
//
//        console.log(body)
//
//        console.log("SUBMITTING PAYMENT")
//
//        //ripple_methods.sendXRP(rippleObj, function(err, body){
//        //    if (err) return console.log(err)
//        //
//        //    console.log(body)
//        //})
//    })
//
//})

ripple_methods.generate_wallet(function(err, wallet) {
    console.log(wallet);
})
