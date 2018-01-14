import mosca from 'mosca';
// import Authorizer from 'mosca/lib/authorizer';
import bcrypt from 'bcrypt';
import Auth from './models/auth';
import Device from './models/device';
import { moscaSettings } from './config';
import logger from './utils/logger';

const server = new mosca.Server(moscaSettings);
// const authorizer = new Authorizer();

// In this case the client authorized as alice can publish to /users/alice taking
// the username from the topic and verifing it is the same of the authorized user
const authorizePublish = (client, topic, payload, callback) => {
  callback(null, client.user === topic.split('/')[1]);
};

// In this case the client authorized as alice can subscribe to /users/alice taking
// the username from the topic and verifing it is the same of the authorized user
const authorizeSubscribe = (client, topic, callback) => {
  callback(null, client.user === topic.split('/')[1]);
};

const setup = () => {
  process.on('SIGHUP', setup);
  server.on('closed', () => {
    process.removeListener('SIGHUP', setup);
  });
  server.authenticate = authenticate;
  server.authorizeSubscribe = authorizeSubscribe;
  server.authorizePublish = authorizePublish;
  logger.info('Mosca server is up and running');
};

const Mqttsv = () => {
  server.on('ready', setup);
  server.on('clientConnected', (client) => {
    logger.info('client connected', client.id.toString());
  });

  // fired when a message is received
  server.on('published', (packet, client) => {
    logger.info('Published', packet, client);

    const { topic } = packet;

    if (topic.indexOf('ESP:INFO') !== -1) {
      const message = JSON.parse(packet.payload.toString());
      server.emit('getInfo', message);
    } else if (topic.indexOf('ESP:SERVER') !== -1) {
      const message = JSON.parse(packet.payload.toString());
      logger.info('PAYLOAD', message);
      Auth.findOne({
        username: message.user,
      }).exec((err, doc) => {
        if (err) {
          logger.info(err);
        } else if (doc === null) {
          logger.info('Pengguna belum teregistrasi');
        } else if (doc.status === 'active') {
          // Save Device
          Device.findOne({
            deviceid: message.id,
            user: doc._id,
          }).exec((errD, docD) => {
            if (docD === null) {
              const dv = new Device({
                deviceid: message.id,
                devicelabel: `Label-${message.id}`,
                user: doc._id,
              });

              dv.save((errDevice) => {
                if (errDevice) {
                  if (errDevice.code) {
                    // Error code if record is available
                    if (errDevice.code === 11000) {
                      logger.info('Device sudah terdaftar');
                      updateOnlineStat(message.id, doc._id, 1);
                    }
                  } else {
                    logger.info(errDevice);
                  }
                } else {
                  logger.info('Device berhasil didaftarkan');
                }
              });
            } else {
              logger.info(`Perangkat dengan ID ${message.id} dan pengguna ${doc._id} sudah terdaftar`);
              updateOnlineStat(message.id, doc._id, 1);
            }
          });
        } else {
          logger.info('Akun sudah di aktifasi');
        }
      });
    }
  });

  // fired when a client subscribes to a topic
  server.on('subscribed', (topic, client) => {
    logger.info('subscribed : ', topic, client);
  });

  // when client return puback,
  server.on('delivered', (packet, client) => {
    logger.info('Delivered', packet, client);
  });

  // fired when a client is disconnecting
  server.on('clientDisconnecting', (client) => {
    logger.info('clientDisconnecting : ', client.id);
  });

  // fired when a client is disconnected
  server.on('clientDisconnected', (client) => {
    logger.info('clientDisconnected : ', client.id);
    updateOfflineStat(client.id, 1, 0);
  });
};

Mqttsv.prototype.getServer = () => (server);

const updateOnlineStat = (deviceId, user, stat) => {
  Device.update({
    deviceid: deviceId,
    user,
  }, {
    $set: {
      online: stat,
    },
  }, (err, doc) => {
    if (err) logger.info(err);
    let ol = 'Online';

    if (stat === 1) ol = 'Online';
    else ol = 'Offline';

    logger.info(`${deviceId} Status ${ol}`);
    logger.info(`Document ${doc}`);
  });
};

const updateOfflineStat = (deviceId, st, stat) => {
  Device.update({
    deviceid: deviceId,
    online: st,
  }, {
    $set: {
      online: stat,
    },
  }, (err, doc) => {
    if (err) logger.info(err);
    let ol = 'Online';

    if (stat === 1) ol = 'Online';
    else ol = 'Offline';

    logger.info(`${deviceId} Status ${ol}`);
    logger.info(`Document ${doc}`);
  });
};

const authenticate = (client, username, password, callback) => {
  Auth.findOne({
    username,
  }).exec((err, doc) => {
    if (err) {
      logger.info(err);
      callback(null, false);
    } else if (doc === null) {
      logger.info(`Tidak ditemukan pengguna ${username} dalam database`);
      callback(null, false);
    } else if (doc.status === 'active') {
      try {
        bcrypt.compare(password.toString(), doc.password, (errBcrypt, resBcrypt) => {
          if (errBcrypt) {
            logger.info(errBcrypt);
            callback(null, false);
          } else if (resBcrypt === true) {
            logger.info('MQTT Autentikasi valid');
            callback(null, true);
          } else {
            logger.info('MQTT Password salah');
            callback(null, false);
          }
        });
      } catch (e) {
        logger.info('Terjadi kesalahan dalam komparasi password');
        callback(null, false);
      }
    } else {
      logger.info('Pengguna belum diaktifkan');
      callback(null, false);
    }
  });
};

export default Mqttsv;
