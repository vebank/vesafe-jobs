function logger(msg) {
    try {
        let log = {
            'args': JSON.stringify(arguments),
            'filename': '', // TODO get info
            'line_no': 0
        }
        console.debug(log)
    } catch (e) {
        console.error(e)
    }
}

export {
    logger
}
