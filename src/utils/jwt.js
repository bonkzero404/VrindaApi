import jwt from 'jsonwebtoken';
import { basic } from '../config';

export default function (req, res, next) {
  const token = req.body.token || req.query.token || req.headers.authorization;

  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, basic.apiServer.jwtSecret, (err, decoded) => {
      if (err) {
        res.json({ valid: false, messages: ['Failed to authenticate token.'] });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    // if there is no token return an error
    res
      .status(401)
      .send({ valid: false, messages: ['No token provided.'] });
  }
}
