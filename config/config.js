/**
 * Created by priyav on 17/07/15.
 * Environment Variables placed here
 */
if(process.env.NODE_ENV === 'test') {
    console.log("initialized test environment");
    module.exports = {
        db: "mongodb://localhost/ecommerce-test",
        port: 3001
    }
} else {
    console.log("initialized development environment");
    module.exports = {
        db: "mongodb://localhost/ecommerce",
        port: 3000
    }
}
