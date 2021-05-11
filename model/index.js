import mongodb from "mongodb";
import configs from "../configs/index.js";

const client = new mongodb.MongoClient(configs.DB_HOST, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

(async () => {
  try {
    if (client.isConnected()) return;
    await client.connect();
    return client;
  } catch (error) {
    console.error(error);
    return error;
  }
})();

export default client;
