import mongoose from "mongoose";
import configs from "../configs/index.js";

mongoose.connect(configs.DB_HOST, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", (e) => console.error("connection error:", e));
db.once("open", () => {
  // we're connected!
  console.info("Mongodb is connected successful");
});

export default db;
