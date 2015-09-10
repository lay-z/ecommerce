/**
 * Created by priyav on 17/07/15.
 * Environment Variables placed here
 */

var config = {
    bank: {
        address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        secret: "snoPBrXtMeMyMHUVTgbuqAfg1SUTb"
    },
    paypal: {
        id: "AWsD608kupzRQtt2BLPxyAgGY51iqac7MijsPXfgV8Ejh97pemztuq_CU3EmgeodKS7t5tiaaH2AQU14",
        secret: "EPm94671GXrCADeKvKQlTO_RZaZUl4pibYnNxcXJUGZwR_Sw9ld6yle8Sjlh31eHJvwr9ptgRzEYv-mn"
    },
    paypal_classic: {
        USER_ID: "priyavrocks-facilitator_api1.gmail.com",
        USER_PASSWORD: "N79WP6SL5VN3Y3VV",
        SECURITY_SIGNATURE: "AFI6817FgiwVFRY4bJ-G2xqixwsTAPI2wjbjLbhkJZXvTRGQEZsEHtfu",
        APP_ID: "APP-80W284485P519543T"
    },
    global_key: "397f>cP$&u]48F(l9I45Q8k%2{8&IJ",
    twilio: {
        SID: "ACfa309fd42245a163fd63467382854f81",
        AUTH: "f1bf6f14083a7da37f03abf0b480224e",
        number: "441480260116"
    }
};

if(process.env.NODE_ENV === 'test') {
    console.log("initialized test environment");
    config.db = "mongodb://localhost/ecommerce-test";
    config.port = 3001;
} else {
    console.log("initialized development environment");
    config.db = "mongodb://localhost/ecommerce";
    config.port = 3000;
}

module.exports = config;
