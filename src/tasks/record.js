import { logger } from "../utils/index.js";
import { safeTxn, TxLog } from "../models/index.js";
import configuration from "../configuration.js";


const recordSafe = async (log) => {
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

            const _history = await safeTxn.findOne({
                'txn_hash': returnValues.approvedHash.toLowerCase(),
            })

            if (_history == null) {
                await safeTxn.insertOne({
                    'txn_hash': returnValues.approvedHash.toLowerCase(),
                    "created_by": 'VeSafe-Jobs',
                    "owner": returnValues.owner
                })

            }

            // Update txn status: approved, execTransaction success/failure 
            await safeTxn.updateOne({
                'txn_hash': returnValues.approvedHash.toLowerCase(),
            }, {
                "$push": {
                    approve: {
                        "meta": meta,
                        "returnValues": returnValues

                    }
                },
                "$set": {
                    "status": "approved",
                }
            }, {
                upsert: true
            })


        }
    } catch (e) {
        console.error(e)
    }
}

export default recordSafe
