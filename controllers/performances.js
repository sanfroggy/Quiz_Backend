/*Defining constants for quiz and performance models,
express Router and userExtractor middleware. */
const performancesRouter = require('express').Router()
const Quiz = require('../models/quiz')
const Performance = require('../models/performance')
const { userExtractor } = require('../utils/middleware')

/*Defining the route for getting performances from MongoDB and
populating their user value with the referred User object's
username, and the quiz value with the author username, as well as
title and difficulty. */
performancesRouter.get('/', async (request, response) => {
    const performances = await Performance.find({}).populate('user', { username: 1 })
        .populate({ path: 'quiz', populate: { path: 'author', username: 1 }, title: 1, difficulty: 1 })
    response.json(performances)
})

/*Defining the route for getting performances from MongoDB based on 
a user id and populating their quiz value with the author username, as well as
title and difficulty. */
performancesRouter.get('/user/:id', async (request, response) => {
    const performances = await Performance.find({ author: request.params.id })
        .populate({ path: 'quiz', populate: { path: 'author', username: 1 }, title: 1, difficulty: 1 })
    response.json(performances)
})

/*Defining the route for getting performances from MongoDB based on 
a quiz id and populating their user value with the referred User object's
username. */
performancesRouter.get('/quiz/:id', async (request, response) => {
    const performances = await Performance.find({ quiz: request.params.id}).populate('user', { username: 1 })
    response.json(performances)
})

/*Defining the route for saving a new performance with async / await. 
if the related quiz or user does not exist anymore, or given id is invalid,
an appropriate error message is returned. */
performancesRouter.post('/quiz/:id', userExtractor, async (request, response) => {

    const body = request.body

    const user = request.user

    const quiz = await Quiz.findById(request.params.id)

    const performance = new Performance({
        questionsAnswered: body.questionsAnswered,
        user: user,
        quiz: quiz
    })

    /*If the related quiz and user are found from the MongoDB database 
    the performance is saved and the data of the new object is returned 
    in the response. */
    if (quiz && user) {

        const savedPerformance = await performance.save()
        response.status(201).json(savedPerformance)

    } else {
        response
            .status(404)
            .json({
                error: 'Quiz or User does not exist.',
            })
            .end()
    }
})



module.exports = performancesRouter