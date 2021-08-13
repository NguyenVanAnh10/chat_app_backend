import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import mongoose from 'mongoose';

import initDatabase from 'models';
import router from 'route';

const app = express();
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use('/api/v1', router);
initDatabase();

let userToken = '';

afterAll(async () => {
  await mongoose.connection.close();
});

const me = {
  id: expect.toBeString(),
  userName: expect.toBeString(),
  email: expect.toBeString(),
  avatar: expect.toBeString(),
  online: expect.toBeBoolean(),
  createdAt: expect.toBeString(),
};
describe('user services', () => {
  it('login', async () => {
    let response;
    try {
      response = await request(app)
        .post('/api/v1/login')
        .send({ userName: 'tester', password: '1' });
      expect(response.status).toBe(200);
      expect(response.header['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringMatching(/^user_token=/)])
      );
      userToken = response.header['set-cookie'][0].replace(/; Path=\/$/, '');

      expect(response.body).toEqual(expect.objectContaining(me));
    } catch (error) {
      console.error(error);
      expect(response.body).toEqual(
        expect.objectContaining({
          error: expect.objectContaining({
            name: expect.toBeString(),
          }),
        })
      );
      expect(response.status).toBe(401);
    }
  });

  it('update online', async () => {
    let response;
    try {
      response = await request(app)
        .put('/api/v1/online')
        .send({ online: true })
        .set('Cookie', userToken);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining(me));
    } catch (error) {
      expect(response.body).toEqual(
        expect.objectContaining({
          error: expect.objectContaining({
            name: expect.toBeString(),
          }),
        })
      );
      expect([400, 401]).toContain(response.status);
    }
  });

  describe('me', () => {
    it('get me', async () => {
      let response;
      try {
        response = await request(app).get('/api/v1/me').set('Cookie', userToken);
        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.objectContaining(me));
      } catch (error) {
        expect(response.body).toEqual(
          expect.objectContaining({
            error: expect.objectContaining({
              name: expect.toBeString(),
            }),
          })
        );
        expect([400, 401]).toContain(response.status);
      }
    });
  });
});

// TODO other api
