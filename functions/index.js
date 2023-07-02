const functions = require("firebase-functions");
require('dotenv').config();
const twilio = require('twilio');
const firebaseAdmin = require('./FirebaseService');
const firestore = firebaseAdmin.firestore();
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onRequest } = require('firebase-functions/v2/https');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

const isDev = process.argv[2] === 'dev';

exports.handleSms = onRequest(handleSms);



// exports.scheduledFunction1 = onSchedule('every day 04:05', checkNewMessagesQueue);
// exports.checkNewMessagesQueue = onSchedule('every day 05:35', checkNewMessagesQueue);
exports.checkNewMessagesQueue = onSchedule('every day 16:00', checkNewMessagesQueue);
exports.sendDailyLoveText = onSchedule('every day 20:00', sendDailyLoveText);


async function handleSms(request, response) {
    if(isDev) {
        console.log('request.body: ' + JSON.stringify(request.body, null, 4));
    }

    if(request.body.From === '+18015747900') {
        const message = request.body.Body;
        
        try {
            firestore.collection('new_messages').add({ 
                message: message,
                createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
             });
        } catch (error) {
            console.error(error);
        }
    }

    response.json({ message: 'yay!' });
}

async function checkNewMessagesQueue(context) {
    const newMessagesSnapshot = await firestore.collection('new_messages').get();
    const size = newMessagesSnapshot.size;

    if(size === 0) {
        sendMessage(`WARNING! You have NO new messages. Reply to add a new message.`, "+18015747900", twilioPhoneNumber);
    } else if(size < 10) {
        sendMessage(`You have ${size} messages left in the queue. Reply to add a new message.`, "+18015747900", twilioPhoneNumber);
    }
}

async function sendDailyLoveText(context) {
    const newMessagesSnapshot = await firestore.collection('new_messages').get();
    const size = newMessagesSnapshot.size;
    const randomIndex = Math.floor(Math.random() * size);
    const randomMessageDoc = newMessagesSnapshot.docs.at(randomIndex);
    const message = randomMessageDoc.data().message;
    await sendMessage(message, "+18015747900", twilioPhoneNumber);

    await firestore.collection('new_messages').doc(randomMessageDoc.id).delete();
    await firestore.collection('sent_messages').add(randomMessageDoc);
}

// TODO: Create 2 cron jobs
// 1. 4 hours before daily message - a check for the number of new 
//    messages in the queue. If less than 10 messages, notify admin.
//    
// 2. on the daily message time - randomly select a message from the
//    new messages queue and send one. Then move to message to sent
//    messages queue.

async function sendMessage(message, to, from) {
    if(isDev) {
        console.log('Sending message...');
        console.log('from: ' + from);
        console.log('to: ' + to);
    }

    try {
        await client.messages.create({
            body: message,
            from: from,
            to: to,
          });
    } catch (error) {
        console.error(error);
    }
}

function getUtc24HourTime(addHours = 0, addMinutes = 0) {
    const now = new Date();

    const hours = (now.getUTCHours() + addHours).toString().padStart(2, '0') ;
    const minutes = (now.getUTCMinutes() + addMinutes).toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;

    return time;
}

if(isDev) {
    console.log('Running local dev...');

    (async () => {
        // const request = { body: { From: '+18015747900', Body: 'Hello from Firebase' } };
        // handleSms(request, null)

        // console.log(getUtc24HourTime(0, 0, 0));
        // await checkNewMessagesQueue();
        await sendDailyLoveText();
    })();
}
