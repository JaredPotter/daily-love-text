const admin = require("firebase-admin");

const serviceAccount = require("./daily-love-text-firebase-adminsdk-b45qq-b42e3140ba.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;