import async from 'async';
import validator from 'validator';
import Device from '../models/device';

export const commandOnOff = (req, res) => {
  const request = req.body;
  const locals = {};
  const errors = [];

  if (req.decoded.level === 'administrator' || req.decoded.level === 'manager') 
    return res.json({valid: false, messages: ['Anda tidak mempunyai izin akses untuk menghidupkan atau mematikan perangkat']});
  
  if (req.decoded.status !== 'active') 
    return res.json({valid: false, messages: ['Pengguna belum aktif']});
  
  if (request.deviceId === undefined || validator.isEmpty(request.deviceId)) 
    errors.push('Device ID harus diisi');
  if (request.cmd === undefined || validator.isEmpty(request.cmd)) 
    errors.push('Perintah on/off harus diisi');
  if (request.cmd !== 'on' && request.cmd !== 'off' && request.cmd !== 'info') 
    errors.push('Parameter cmd harus berupa string [on/off]');
  
  // concatenate error validation
  if (errors.length > 0) {
    return res.json({valid: false, messages: errors});
  }

  async.series([// Step 1 Find user by username
    (callback) => {
      Device
        .findOne({deviceid: request.deviceId, user: req.decoded._id})
        .populate('user')
        .exec((err, doc) => {
          if (err) {
            callback({valid: false, messages: err});
          } else {
            // If device is offline
            if (doc.online === 0) {
              return res.json({valid: false, messages: ['Status perangkat dalam keadaan offline, mohon aktifkan perangkat telebih dahulu']});
            }

            if (doc === null) {
              callback({valid: false, messages: ['Device ID belum terdaftar']});
            } else {
              if (doc.user.username === req.decoded.username) {

                // Preparation MQTT publish parameter
                const pack = {
                  topic: `ESP:COMMAND:${doc.deviceid}`,
                  payload: request.cmd
                };

                req
                  .mqtt
                  .publish(pack, () => {
                    const dataResult = {
                      valid: true,
                      messages: [`Perintah [${request.cmd}] berhasil dijalankan`],
                      data: {
                        deviceId: doc.deviceid,
                        label: doc.devicelabel,
                        username: doc.user.username
                      }
                    };

                    if (request.cmd === 'info') {
                      return req
                        .mqtt
                        .on('getInfo', (payload) => {
                          dataResult.message = [`Perintah [${request.cmd}] berhasil dijalankan`];
                          dataResult.data = payload;
                          return res.json(dataResult);
                        });
                    } else {
                      res.json(dataResult);
                    }
                  });
              } else {
                res.json({valid: false, messages: ['Device ID bukan milik pengguna aktif']});
              }
            }
          }
        });
    }
  ], (result) => {
    res.json(result);
  });
};
