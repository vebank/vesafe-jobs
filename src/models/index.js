import {db} from "./db.js";

export const safeTxn = db.collection('safe_txn')
export const TxLog = db.collection('safe_logs')
