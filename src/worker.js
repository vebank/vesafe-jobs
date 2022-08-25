import {Worker} from "./bin/Worker.js";
import * as tasks from './tasks/index.js'
const args = process.argv
    .slice(2)
    .map(arg => arg.split('='))
    .reduce((args, [value, key]) => {
        args[value] = key;
        return args;
    }, {});

const main = async ()=>{

    if (!args.queue) {
        throw Error("'queue' is required config")
    }
    if (!args.task_name) {
        throw Error("'task_name' is required config")
    }
    if (!args.exchange) {
        throw Error("'exchange' is required config")
    }
    const worker = await new Worker(
        [{
            exchange: args.exchange,
            name: args.task_name
        }],
        "topic",
        args.queue
    )
    const handler = tasks[args.task_name]
    if(!handler) {
        throw Error(`'${args.task_name}' not found in /src/tasks/index.js`)
    }
    await worker.connect()
    await worker.setup()
    await worker.pull(
        args.task_name,
        handler
    )
}

main()
