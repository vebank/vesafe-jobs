import {thorify} from "thorify";
import Web3 from "web3";
import Config from "./configuration.js";
import Redis from "ioredis";

export const thor = thorify(new Web3(), Config.THOR_URI);
export const redis = new Redis.Cluster(Config.REDIS_CLUSTER, {
    scaleReads: 'slave'
});
