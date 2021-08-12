import cors from 'cors';
import express from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';

import chatSocket from 'sockets/chat';
import initDatabase from 'models';
import initTransporterEmail from 'ulties/email';
import route from './route/index';

const PORT = process.env.PORT || 5000;
const app = express();
const httpServer = http.createServer(app);
const io = chatSocket(httpServer);
const db = initDatabase();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.set('socketio', io);
app.use(cookieParser());
initTransporterEmail();

app.use('/api/v1', route);

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.');
  console.log('Closing http server.');
  httpServer.close(async () => {
    console.log('Http server closed.');
    await db.close();
    process.exit(0);
  });
});

httpServer.listen(PORT, () => console.log(`Server is running on ${PORT}`));
