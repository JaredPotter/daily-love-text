require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);


(async () => {
    try {
        const response = await client.messages.create({
            body: 'Hello from Twilio!',
            from: '+18775221772', // your Twilio number
            to: '+18015747900', // your phone number
            // statusCallback: 'https://us-central1-daily-love-text.cloudfunctions.net/handleSms'
          });
    } catch (error) {
        console.error(error);
        debugger;
    }

    console.log('done.');
})()

