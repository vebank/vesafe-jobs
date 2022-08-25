import {connect} from "amqp-connection-manager";
import Config from "../configuration.js";
import {logger} from "../utils/index.js";
import {captureException} from "@sentry/node";

export class Worker {
    constructor(tasks, channel_type = "topic", queue = '') {
        this.queue = queue
        this.channel_type = channel_type
        this.channels = {}
        this.tasks = tasks

    }

    async connect() {
        this.amqp = await connect([
            Config.AMQP_URI,
        ], {
            heartbeatIntervalInSeconds: 10,

        })
        this.amqp.on('connect', () => logger('RabbitMQ Connected!'));
        this.amqp.on('disconnect', (err) => {
            if (err) {
                logger(`RabbitMQ Disconnected. `, err)
            }
            return null;
        });
        this.amqp.on('error', (err) => {
            if (err) {
                logger(`ERROR Rabbit MQ ... `, err)
                return err;
            }
            return null;
        });

    }

    async setup() {
        let tasks = this.tasks
        let channel_type = this.channel_type
        for (let task of tasks) {
            this.tasks[task.name] = task.exchange
            this.channels[task.exchange] = await this.amqp.createChannel({
                json: true,
                setup: async function (channel) {
                    // `channel` here is a regular amqplib `ConfirmChannel`.
                    // Note that `this` here is the channelWrapper instance.
                    return Promise.all([
                        channel.assertExchange(task.exchange, channel_type, {durable: true})
                    ])
                }
            })
        }
    }

    async push(task, args) {
        /*
        * task name
        *
        * */
        if (!this.tasks[task]) {
            throw Error("Unknown task. Please create before call")
        }
        try {
            await this.channels[this.tasks[task]].publish(
                this.tasks[task], //
                task, // routingKey
                args, // data
                {contentType: 'application/json', persistent: true}
            )
            // await this.channels[this.tasks[task]].sendToQueue(this.queue, args)
        } catch (e) {
            console.error(e)
            captureException(e)
        }
        return true;
    }

    async pull(task, handler) {
        if (!this.tasks[task]) {
            throw Error("Unknown task. Please create before call")
        }
        try {
            let channel_type = this.channel_type
            let queue = this.queue
            let exchange = this.tasks[task]
            let _channel = this.channels[exchange]
            await _channel.addSetup(function (channel) {
                return Promise.all([
                    channel.assertQueue(queue, { exclusive: true}),
                    channel.bindQueue(queue, exchange, task),
                    channel.consume(queue, async (msg) => {
                            try {
                                await handler(msg.content.toString())
                                channel.ack(msg)
                            } catch (e) {
                                channel.nack(msg);
                                captureException(e)
                            }
                        }, {
                            noAck: false
                        }
                    )
                ]);
            });

        } catch (e) {
            console.error(e)
            captureException(e)
        }
    }
}
