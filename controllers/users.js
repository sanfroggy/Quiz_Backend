//Defining constants for bcrypt, express Router and the user module.
const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

/*Defining the route for saving a new user with async / await, 
and use bcrypt to hash the given password, unless
a password is not given or it is shorter than 3 characters. */
usersRouter.post('/', async (request, response) => {
    const { username, password } = request.body

    if (!password || password.length < 3) {
        response.status(400).json({ error: 'Password must have a value of at least 3 characters.' }).end()
    } else {
        const saltRounds = 10
        const passwordHash = await bcrypt.hash(password, saltRounds)

        const user = new User({
            username,
            passwordHash,
        })

        const savedUser = await user.save()

        response.status(201).json(savedUser)
    }
})

/*Defining the route for getting users from MongoDB and
populating their blogs array with the referred Blog object's
url, title and author. */
usersRouter.get('/', async (request, response) => {
    const users = await User.find({}).populate('quizzes', { title: 1, difficulty: 1, ratings: 1 })
    response.json(users)
})

module.exports = usersRouter
