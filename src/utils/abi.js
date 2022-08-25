import {thor} from "../lib.js";

const getEventABI = (abi, event) => {
    for (let _abi of abi) {
        if (_abi.name === event) {
            return _abi
        }
    }
    return {}
}
const getDataOfEvent =  (abi, logs) => {
    try {
        for (let _log of logs) {
            try {
                let argTopics = abi.anonymous ? _log.topics : _log.topics.slice(1);
                let data = thor.eth.abi.decodeLog(abi.inputs, _log.data, argTopics)
                return data
            } catch (e) {
            }
        }
        return null
    } catch (e) {
        console.error(e)
    }
}
export {
    getDataOfEvent,
    getEventABI
}
