import mongoose from 'mongoose';
import configs from 'configs';

mongoose.connect(configs.DB_LOCAL_HOST || configs.DB_HOST, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set('useFindAndModify', false);

const db = mongoose.connection;
db.on('error', e => console.error('connection error:', e));
db.once('open', () => {
  // we're connected!
  console.info('Mongodb is connected successful');
});

export default db;
