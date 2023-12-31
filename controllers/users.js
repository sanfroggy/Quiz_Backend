//Defining constants for bcrypt, express Router and the user module.
const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

/*Defining the route for saving a new user with async / await, 
and use bcrypt to hash the given password, unless
a password is not given or it is shorter than 8 characters. */
usersRouter.post('/', async (request, response) => {
    const { username, password } = request.body

    try {
        const saltRounds = 10
        const passwordHash = await bcrypt.hash(password, saltRounds)

        const user = new User({
            username,
            passwordHash,
        })

        const savedUser = await user.save()

        response.status(201).json(savedUser)

    } catch (error) {
        response.status(400).json(error).end()
    }

})

/*Defining the route for getting users from MongoDB and
populating their quizzes array with the referred Quiz object's
title, difficulty and ratings. */
usersRouter.get('/', async (request, response) => {
    const users = await User.find({}).populate('quizzes', { title: 1, difficulty: 1, ratings: 1 })
    response.json(users)
})

/*Defining the route for getting a user from MongoDB and
populating the quizzes array with the referred Quiz object's
title. */
usersRouter.get('/:id', async (request, response) => {
    const users = await User.findById(request.params.id).populate('quizzes', { title: 1 })
    response.json(users)
})

module.exports = usersRouter
