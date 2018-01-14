/** @module src/server */
/* eslint no-console: "off" */
import { Server } from 'http';
import Express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compress from 'compression';
import methodOverride from 'method-override';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import routes from './routes';
import defaultuser from './utils/defaultuser';
import Mqttsv from './mqtt-server';
import { basic } from './config';
import logger from './utils/logger';

const app = new Express();
const mqttsv = new Mqttsv();
const server = new Server(app);

/** Set port config. (ex: PORT=5000) */
const port = process.env.PORT || basic.apiServer.port;

/** set node environment production/development. (ex: NODE_ENV=production) */
const env = process.env.NODE_ENV || 'production';

mqttsv
  .getServer()
  .attachHttpServer(server);

mongoose.Promise = global.Promise;
/** @function */
mongoose.connect(basic.mongoUrl, { useMongoClient: true });
mongoose
  .connection
  .on('error', () => {
    logger.info('unable to connect to database');
  });

// parse body params and attache them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compress());
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());

app.use(cors({ exposedHeaders: ['Link'] }));

app.use((req, res, next) => {
  // Override res.json in the very first middleware Send MQTT access library to
  // router
  const send = res.json;
  let sent = false;

  req.mqtt = mqttsv.getServer();
  res.json = (data) => {
    if (sent) {
      return;
    }
    send.bind(res)(data);
    sent = true;
  };
  next();
});

app.use((req, res, next) => {
  res.setTimeout(10000, () => {
    logger.info('Request has timed out.');
    res.json({ valid: false, messages: ['Request Timeout'] });
  });

  next();
});

// mount all routes on /api path
app.use('/api', routes);

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res) => {
  res.status(err.status || 500);
  res.json({
    error: {
      messages: err.message,
    },
  });
});

// insert admin user
defaultuser();

server.listen(port, (err) => {
  if (err) {
    return logger.info(err);
  }
  return logger.info(`Server running on http://localhost:${port} [${env}]`);
});
