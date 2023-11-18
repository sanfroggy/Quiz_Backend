/*Defining constants for blog model,
express Router, blog and user modules and 
userExtractor middleware. */
const performancesRouter = require('express').Router()
const Quiz = require('../models/quiz')
const Performance = require('../models/performance')
const { userExtractor } = require('../utils/middleware')

/*Defining the route for getting blogs from MongoDB and
populating their user value with the referred User object's
username, and name. */
performancesRouter.get('/', async (request, response) => {
    const performances = await Performance.find({}).populate('user', { username: 1 })
        .populate({ path: 'quiz', populate: { path: 'author', username: 1 }, title: 1, difficulty: 1 })
    response.json(performances)
})

/*Defining the route for getting blogs from MongoDB and
populating their user value with the referred User object's
username, and name. */
performancesRouter.get('/user/:id', async (request, response) => {
    const performances = await Performance.find({ author: request.params.id })
        .populate({ path: 'quiz', populate: { path: 'author', username: 1 }, title: 1, difficulty: 1 })
    response.json(performances)
})

/*Defining the route for getting blogs from MongoDB and
populating their user value with the referred User object's
username, and name. */
performancesRouter.get('/quiz/:id', async (request, response) => {
    const performances = await Performance.find({ quiz: request.params.id}).populate('user', { username: 1 })
    response.json(performances)
})

/*Defining the route for saving a new comment with async / await. 
if the commented blog does not exist anymore, or given id is invalid,
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

    /*If the blog is found from the MongoDB database it is saved
    and the id of the comment is also saved to the blog data as
    a reference. */
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