import mosca from 'mosca';

///////////////////////
// Basic Configuration
///////////////////////
export const basic = {
  mongoUrl: 'mongodb://localhost:27017/vrindadb',
  apiServer: {
    port: 8080,
    jwtSecret: 'sangattahasia',
    generatePasswordLength: 8,
    saltRounds: 10
  }
};

///////////////////////
// Ascoltatore DB
///////////////////////
export const ascoltatore = {
  type: 'mongo',
  url: basic.mongoUrl,
  pubSubCollection: 'ascoltatori',
  mongo: {}
};

////////////////////////
// MQTT Mosca Settings
////////////////////////
export const moscaSettings = {
  interfaces: [{
    type: 'mqtt',
    port: 1883
  }],
  backend: ascoltatore,
  logger: {
    name: 'mqttlogger',
    lebel: 40
  },
  persistence: {
    factory: mosca.persistence.Mongo,
    url: basic.mongoUrl
  }
};

/////////////////////////
// Default Admin Account
////////////////////////
export const admin = {
  user: {
    userid: '1234567890987654',
    fullname: 'Administrator',
    phone: '087775298468',
    email: 'bonkzero404@gmail.com'
  },
  auth: {
    username: 'admin',
    password: 'blackbuzzmin123',
    level: 'administrator',
    status: 'active'
  }
};
