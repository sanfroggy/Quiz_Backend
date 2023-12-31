const config = require('./utils/config')
const express = require('express')
const mongoose = require('mongoose')
const logger = require('./utils/logger')
const cors = require('cors')
const app = express()
const { requestLogger, unknownEndpoint, errorHandler, tokenExtractor } = require('./utils/middleware')
const loginRouter = require('./controllers/login')
const usersRouter = require('./controllers/users')
const { quizzesRouter, imagesRouter } = require('./controllers/quizzes')
const questionsRouter = require('./controllers/questions')
const performancesRouter = require('./controllers/performances')

mongoose.set('strictQuery', false)

/*Showing a message indicating the status of the connection
attempt through the use of logger middleware. */
logger.info('connecting to', config.MONGODB_URI)

mongoose.connect(config.MONGODB_URI)
    .then(() => {
        logger.info('connected to MongoDB')
    })
    .catch((error) => {
        logger.error('error connection to MongoDB:', error.message)
    })

app.use(cors())
app.use(express.static('build'))
app.use(express.json())
app.use(requestLogger)
app.use(tokenExtractor)

app.use('/api/login', loginRouter)
app.use('/api/users', usersRouter)
app.use('/api/quizzes', quizzesRouter)
app.use('/api/images', imagesRouter)
app.use('/api/questions', questionsRouter)
app.use('/api/performances', performancesRouter)

app.use(unknownEndpoint)
app.use(errorHandler)

module.exports = app