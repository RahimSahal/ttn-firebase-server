const mqtt = require('mqtt');
const admin = require('firebase-admin');
const express = require('express');

// Initialize Express
const app = express();

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://fyp1-c7e2b-default-rtdb.firebaseio.com' });
const db = admin.database();
const ref = db.ref('sensor_data');

// MQTT Configuration
const BROKER = 'tcp://au1.cloud.thethings.network:1883';
const CLIENT_ID = 'node-server-' + Date.now();
const USERNAME = 'disaster-system1@ttn';
const PASSWORD = 'NNSXS.ZI3ISSVIVOEVXPOU4BK2VU3LTTXAKDVNA3V22RA.HISDAR2UPNLHZ3DMFD2TQ2OYIUDOEC5ECTE36SYOSHYIXQJS64CQ';
const TOPIC = 'v3/disaster-system1@ttn/devices/node01/up';

// Connect to MQTT
const client = mqtt.connect(BROKER, {
    clientId: CLIENT_ID,
    username: USERNAME,
    password: PASSWORD
});

client.on('connect', () => {
    console.log('Connected to TTN MQTT');
    client.subscribe(TOPIC, (err) => {
        if (!err) console.log(`Subscribed to ${TOPIC}`);
        else console.error('Subscription error:', err);
    });
});

client.on('message', (topic, message) => {
    try {
        const payload = JSON.parse(message.toString());
        const decoded = payload.uplink_message.decoded_payload;
        const data = {
            temperature: decoded.temperature,
            distance: decoded.distance,
            soilMoisture: decoded.soilMoisture,
            soilMoisturePercentage: decoded.soilMoisturePercentage,
            pm25: decoded.pm25,
            mq2: decoded.mq2,
            humidity: decoded.humidity,
            timestamp: Date.now()
        };

        const newRef = ref.push();
        newRef.set(data)
            .then(() => console.log('Data saved to Firebase:', data))
            .catch(err => console.error('Error saving to Firebase:', err));
    } catch (err) {
        console.error('Error parsing MQTT message:', err);
    }
});

client.on('error', (err) => {
    console.error('MQTT error:', err);
});

client.on('close', () => {
    console.log('MQTT connection closed');
});

// Start HTTP server to satisfy Render's port requirement
app.get('/', (req, res) => res.send('TTN Firebase Server Running'));
app.listen(process.env.PORT || 10000, '0.0.0.0', () => {
    console.log('HTTP server running on port', process.env.PORT || 10000);
});
