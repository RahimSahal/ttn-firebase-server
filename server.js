const mqtt = require('mqtt');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://fyp1-c7e2b-default-rtdb.firebaseio.com'
});
const db = admin.database();
const ref = db.ref('sensor_data');

// MQTT Configuration (from your MqttManager.java)
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

        // Save to Firebase with a unique key
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