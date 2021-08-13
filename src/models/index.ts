import mongoose from 'mongoose';
import configs from 'configs';

const initDatabase = async (): Promise<void> => {
  try {
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useUnifiedTopology', true);
    await mongoose.connect(configs.DB_HOST, {
      useFindAndModify: true,
    });

    mongoose.connection.once('connected', () => {
      // we're connected!
      console.info('Mongodb is connected successful');
    });
    process.on('SIGTERM', async () => {
      // close mongoose
      await mongoose.connection.close();
    });
  } catch (error) {
    console.error('connection error:', error);
  }
};

export default initDatabase;
