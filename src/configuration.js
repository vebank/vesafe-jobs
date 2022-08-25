
import dotenv from "dotenv";

dotenv.config()

const Config = {
    DB_URI: process.env.DB_URI,
    THOR_URI: process.env.THOR_URI,
    REDIS_CLUSTER: JSON.parse(process.env.REDIS_CLUSTER || "[]"),
    SENTRY_DSN: process.env.SENTRY_DSN,
    AMQP_URI: process.env.AMQP_URI,


    SAFE_ADDRESS: process.env.SAFE_ADDRESS,
    SAFE_INIT_AT_BLOCK: process.env.SAFE_INIT_AT_BLOCK,

}


export default Config;
