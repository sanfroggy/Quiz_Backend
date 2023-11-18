const logger = require('./logger')
const jwt = require('jsonwebtoken')
const User = require('../models/user')

/*Separating the actual value of the received authorization token
from the authorization scheme declaration. (Bearer in this case) */
const tokenExtractor = (req, res, next) => {
    let authorization = req.get('authorization')
    if (authorization && authorization.startsWith('Bearer ')) {
        req.token = authorization.replace('Bearer ', '')
    }
    if (authorization && authorization.startsWith('bearer ')) {
        req.token = authorization.replace('bearer ', '')
    }

    next()
}

/*Getting the user by decoding the token received in the request.
Also checking if the decoded token contains a user id.*/
const userExtractor = async (req, res, next) => {

    const decoded = jwt.verify(req.token, process.env.SECRET)

    if (!decoded.id) {
        res.status(401).json({ error: 'Invalid token.' })
    }

    req.user = await User.findById(decoded.id)

    next()
}

//Defining an Express request logger middleware
const requestLogger = (req, res, next) => {
    logger.info('Method:', req.method)
    logger.info('Path:  ', req.path)
    logger.info('Body:  ', req.body)
    next()
}

//Defining an error handler for unknown endpoints.
const unknownEndpoint = (req, res) => {
    res.status(404).send({ error: 'Unknown endpoint' })
}

//Defining the use of Express error handler middleware.
const errorHandler = (error, req, res, next) => {
    logger.error(error.message)

    if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message })
    }

    if (error.name === 'MongooseError') {
        return res.status(500).send({ error: 'Unable to connect to database.' })
    }

    if (error.name === 'CastError') {
        return res.status(400).send({ error: 'Malformatted id.' })
    }

    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Token missing or invalid.' })
    }

    next(error)
}

//Exporting the defined error handlers.
module.exports = {
    requestLogger,
    unknownEndpoint,
    errorHandler,
    tokenExtractor,
    userExtractor
}
