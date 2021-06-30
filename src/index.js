import cors from 'cors';
import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import rootRoute from 'routes/root';
import chatSocket from 'sockets/chat';
import db from 'models';
import initTransporterEmail from 'ulties/email';

const PORT = process.env.PORT || 5000;
const app = express();
const httpServer = http.createServer(app);
const io = chatSocket(httpServer);

app.use(cors());
app.use(express.json({ limit: '5mb' }));
// app.use(express.urlencoded({ limit: "5mb" }));
app.use(bodyParser.json());
app.set('socketio', io);
app.use(cookieParser());
initTransporterEmail();

app.use('/api/v1', rootRoute);

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
