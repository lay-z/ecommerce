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
        //id-bus: "AKDx-cAThEThZ51X2qgHfs3B9c9yAYHYVEpQp6Me0cJis-vpARLL6dH1"
        secret: "EPm94671GXrCADeKvKQlTO_RZaZUl4pibYnNxcXJUGZwR_Sw9ld6yle8Sjlh31eHJvwr9ptgRzEYv-mn",
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
