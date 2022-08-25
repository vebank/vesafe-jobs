// Connection URL
import {MongoClient} from "mongodb";
import configuration from "../configuration.js";

const client = new MongoClient(configuration.DB_URI);
export const db =  client.db("safe")
