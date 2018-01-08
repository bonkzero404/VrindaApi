import express from 'express';
import users from './users';
import command from './command';
import device from './device';

const router = express.Router(); // eslint-disable-line new-cap

/** GET /api - First router */
router.get('/', (req, res) => {
  res.json({
    valid: true,
    messages: ['Api Info'],
    data: {
      apiName: 'VrindaApi',
      apiDescription: 'RestFul Service for IoT Platform',
      apiVersion: '1.0.0'
    }
  });
});

router.use('/user', users);
router.use('/switch', command);
router.use('/device', device);

export default router;
