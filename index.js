const app = require('./app')
const config = require('./utils/config')
const logger = require('./utils/logger')

/*Get the port to listen to from enviromental variable through
config module and show a message when server is running. */
app.listen(config.PORT, () => {
    logger.info(`Server running on port ${config.PORT}`)
})
