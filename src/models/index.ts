import mongoose from 'mongoose';
import configs from 'configs';

mongoose
  .connect(configs.DB_HOST, {
    useFindAndModify: false,
  })
  .catch(e => console.error('connection error:', e));

mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);

const db = mongoose.connection;
db.once('open', () => {
  // we're connected!
  console.info('Mongodb is connected successful');
});

export default db;
