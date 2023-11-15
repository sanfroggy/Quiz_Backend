/*Defining constants for blog model,
express Router, blog and user modules and 
userExtractor middleware. */
const questionsRouter = require('express').Router()
const Question = require('../models/question')
const Answer = require('../models/answer')
const { userExtractor } = require('../utils/middleware')

/*Defining the route for getting blogs from MongoDB and
populating their user value with the referred User object's
username, and name. */
questionsRouter.get('/', async (request, response) => {
    const questions = await Question.find({}).populate('answers', { title: 1, question: 1 })
        .populate('correctAnswer', { title: 1, question: 1 })
    response.json(questions)
})

/*Defining the route for deleting an existing blog with
async / await, unless the given id is invalid. Returning
an approppriate error message if given an invalid id. */
questionsRouter.delete('/:id', userExtractor, async (request, response) => {

    /*Using the define dmiddlewares to identify the logged in user
    by decoding the jtw authorization token and making sure that 
    only the user who has created the blog, can delete it. */
    const questionToDelete = await Question.findById(request.params.id).populate('quiz', { author: 1, title: 1 })
    const quiz = questionToDelete.quiz

    const user = request.user

    if (user.id.toString() !== questionToDelete.quiz.author.toString()) {
        return response.status(401).json({ error: 'Unauthorized.' })
    }

    if (questionToDelete !== null && questionToDelete !== undefined) {

        /*Deleting the blog with the received id and removing the reference to
        the deleted blog from the users.blogs array and saving the user. */
        const index = quiz.questions.indexOf(questionToDelete.id)

        if (index > -1) {
            quiz.questions.splice(index, 1)
        }

        const answers = Answer.find({})

        await answers.deleteMany({question : questionToDelete.id.toString() })

        await Question.findOneAndRemove(questionToDelete)

        await quiz.save()

        response.status(204).end()
    } else {
        response.status(400).end()
    }
})

/*Defining the route for saving a new comment with async / await. 
if the commented blog does not exist anymore, or given id is invalid,
an appropriate error message is returned. */
questionsRouter.post('/:id/answers', async (request, response) => {

    const body = request.body
    const question = await Question.findById(request.params.id)

    const answer = new Answer({
        title: body.title,
        question: question.id,
    })

    /*If the blog is found from the MongoDB database it is saved
    and the id of the comment is also saved to the blog data as
    a reference. */
    if (question) {
        const savedAnswer = await answer.save()

        if (question.answers.length === 0) {
            if (body.correct) {
                question.correctAnswer = savedAnswer._id
                question.answers = question.answers[0] = savedAnswer._id
                await question.save()
            } else {
                question.answers = question.answers[0] = savedAnswer._id
                await question.save()
            }

        } else {
            if (body.correct) {
                question.correctAnswer = savedAnswer._id
                question.answers = question.answers.concat(savedAnswer._id)
                await question.save()
            } else {
                question.answers = question.answers.concat(savedAnswer._id)
                await question.save()
            }

        }

        response.status(201).json(savedAnswer)
    } else {
        response
            .status(404)
            .json({
                error: 'Question does not exist.',
            })
            .end()
    }
})



module.exports = questionsRouter

