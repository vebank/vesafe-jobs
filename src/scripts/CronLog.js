import {init, captureException} from '@sentry/node';
import Config from "../configuration.js";

init({
    dsn: Config.SENTRY_DSN
});

import {thor} from "../lib.js";
import * as abi from "../abi/index.js" ;
import RedisState from "../helps/RedisState.js";
import {logger} from "../utils/index.js";
import {sleep} from "../utils/time.js";
import {Worker} from "../bin/Worker.js";
import {getDataOfEvent, getEventABI} from "../utils/abi.js";

const args = process.argv
    .slice(2)
    .map(arg => arg.split('='))
    .reduce((args, [value, key]) => {
        args[value] = key;
        return args;
    }, {});

class CronLog {
    constructor(state, address, event, abi, task_name, worker) {
        this.contract = new thor.eth.Contract(abi, address);
        this.state = state
        this.task_name = task_name
        this.worker = worker
        this.event = event
        this.abi = abi


    }

    async process(log) {
        console.log("log", log)

        if (args.receipt && args.receipt_events) {
            let receiptEvents = args.receipt_events.split(",")
            let tx = await thor.eth.getTransactionReceipt(log.transactionHash)
            let events = []
            for(let _event of receiptEvents) {
                let event_abi = getEventABI(this.abi, _event)
                let _data = getDataOfEvent(event_abi, tx.outputs[0].events)
                if(_data) {
                    events.push({
                        name: _event,
                        args: _data
                    })
                }
            }
            log.events = events
        }
        await this.worker.push(this.task_name, log)
    }

    async scan(from_block, to_block) {
        let logs = await this.contract.getPastEvents(this.event, {
            fromBlock: from_block,
            toBlock: to_block
        })
        for (let log of logs) {
            await this.process(log)
        }
    }

    async run() {
        try {
            logger("RUN Cron logs")
            let bulk_size = 500;
            let block_number = await thor.eth.getBlockNumber()
            this.state.load()
            let {last_block} = this.state
            let from_block = last_block;
            let to_block = 0

            while (to_block < block_number) {
                logger({
                    to_block: to_block,
                    block_number: block_number
                })
                if (block_number - from_block > bulk_size) {
                    to_block = from_block + bulk_size
                } else {
                    to_block = block_number
                }
                await this.scan(from_block, to_block)
                logger("Done", {
                    from_block,
                    to_block
                })
                from_block = to_block + 1

            }
            last_block = block_number - 10 // confirm 10 block again

            this.state.last_block = last_block
            this.state.save()

        } catch (e) {
            console.error(e)
        }
    }
}


const getLog = async () => {
    logger("Run CronLog")
    if (!args.contract) {
        throw Error("'contract' is required config")
    }
    if (!args.abi) {
        throw Error("'abi' is required config")
    }
    if (!args.event) {
        throw Error("'event' is required config")
    }
    if (!args.task_name) {
        throw Error("'task_name' is required config")
    }
    if (!args.exchange) {
        throw Error("'exchange' is required config")
    }
    try {

        let task_name = args.task_name
        let contract = args.contract
        let event = args.event
        let contractConfig = {
            address: Config[`${contract}_ADDRESS`],
            initBlock: Config[`${contract}_INIT_AT_BLOCK`]
        }
        let worker = await new Worker(
            [{
                exchange: args.exchange,
                name: task_name
            }],
            "topic"
        )
        await worker.connect()
        await worker.setup()

        let _abi = abi[args.abi]
        let state = new RedisState(
            contractConfig.initBlock,
            contractConfig.address,
            event)
        await state.load();
        const cronLog = new CronLog(
            state,
            contractConfig.address,
            event,
            _abi,
            task_name,
            worker
        )
        if (args.reset) {
            console.log("reset")
            await cronLog.state.reset()
        }
        while (true) {
            await cronLog.run()
            // logger("Sleep 3s")
            await sleep(1000)
        }

    } catch (e) {
        captureException(e)
    }
}

getLog()
