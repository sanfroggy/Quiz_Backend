/*Defining the use of jsonwebtoken, bcrypt, express router
and necessary modules. */
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/user')

/*Defining the route for logging in using token-based
authentication. the existence of a User with the received username
is checked and the bcrypt is used to compare the hash of the given
password to the hash saved in MongoDB database. Environmental variable
SECRET is also used when generating a token. */
loginRouter.post('/', async (request, response) => {
    const { username, password } = request.body

    const user = await User.findOne({ username })
    const passwordCorrect = user === null ? false : await bcrypt.compare(password, user.passwordHash)

    if (!(user && passwordCorrect)) {
        return response.status(401).json({
            error: 'Invalid username or password',
        })
    }

    const userForToken = {
        username: user.username,
        id: user._id,
    }

    const token = jwt.sign(userForToken, process.env.SECRET)

    response.status(200).send({ token, username: user.username})
})

module.exports = loginRouter
