/*Creating and functions for showing informative messages
and error messages. */
const info = (...params) => {
    if (process.env.NODE_ENV !== 'test') {
        console.log(...params)
    }
}

const error = (...params) => {
    if (process.env.NODE_ENV !== 'test') {
        console.log(...params)
    }
}

module.exports = {
    info, error
}
