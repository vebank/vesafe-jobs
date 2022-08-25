import { logger } from "../utils/index.js";
import { safeTxn, TxLog } from "../models/index.js";
import configuration from "../configuration.js";


const recordSafeExecuted = async (log) => {
    try {
        log = JSON.parse(log)
        console.log("log ", log)
        let { event, address, meta, transactionHash, returnValues } = log;
        let { txOrigin, blockNumber } = meta;

        // record log txn event
        let _log = await TxLog.findOne({
            'transactionHash': transactionHash
        })
        if (_log == null) {
            await TxLog.insertOne(log)

            // Update txn status: approved, execTransaction success/failure 
            await safeTxn.updateOne({
                'txn_hash': returnValues.txHash.toLowerCase(),
            }, {
                "$push": {
                    execute: {
                        "meta": meta,
                        "returnValues": returnValues
                    }
                },
                "$set": {
                    "status": event
                }
            }, {
                upsert: true
            })

        }

    } catch (e) {
        console.error(e)
    }
}

export default recordSafeExecuted
