// Imports the Google Cloud client library.
import { Storage } from '@google-cloud/storage';

// Instantiates a client. If you don't specify credentials when constructing
// the client, the client library will look for credentials in the
// environment.
const storage = new Storage();

export default storage;
