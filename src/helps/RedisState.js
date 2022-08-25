import {redis} from "../lib.js";
import {captureException} from "@sentry/node"

class RedisState {
    constructor(init_block = 0, address = '', event = '') {
        this.init_block = init_block;
        this.last_block = init_block;
        this.key = `safe:storage:state:${address.toLowerCase()}:${event.toLowerCase()}`
        this.time = new Date().getTime();
    }

    async reset() {
        this.last_block = this.init_block
        await this.save()
    }

    async load() {
        try {
            let _state = await redis.get(this.key);
            if (_state) {
                _state = JSON.parse(_state)
            } else {
                _state = {
                    "last_block": this.init_block,
                    "time": new Date().getTime()
                }
            }
            const {last_block, time} = _state
            this.last_block = last_block
        } catch (e) {
            captureException(e)
        }
    }

    async save() {
        try {
            this.time = new Date().getTime()
            let _state = JSON.stringify({
                "last_block": this.last_block,
                "time": this.time
            })
            await redis.set(this.key, _state);
        } catch (e) {
            captureException(e)
        }
    }
}

export default RedisState
