/*Defining constants for question and answer models,
express Router and userExtractor middleware. */
const questionsRouter = require('express').Router()
const Question = require('../models/question')
const Answer = require('../models/answer')
const { userExtractor } = require('../utils/middleware')

/*Defining the route for getting questions from MongoDB and
populating their answers value with the referred Answer object's
title, and the related question. Also populating the correctAnswer field
with the referred Answer object. */
questionsRouter.get('/', async (request, response) => {
    const questions = await Question.find({}).populate('answers', { title: 1, question: 1 })
        .populate('correctAnswer', { title: 1, question: 1 })
    response.json(questions)
})

/*Defining the route for deleting an existing question with
async / await, unless the given id is invalid. Returning
an approppriate error message if given an invalid id. */
questionsRouter.delete('/:id', userExtractor, async (request, response) => {

    /*Using the defined middlewares to identify the logged in user
    by decoding the jtw authorization token and making sure that 
    only the user who has created the related quiz, can delete the question. */
    const questionToDelete = await Question.findById(request.params.id).populate('quiz', { author: 1, title: 1 })
    const quiz = questionToDelete.quiz

    const user = request.user

    if (user.id.toString() !== questionToDelete.quiz.author.toString()) {
        return response.status(401).json({ error: 'Unauthorized.' })
    }

    if (questionToDelete !== null && questionToDelete !== undefined) {

        /*Deleting the question with the received id and removing the reference to
        the deleted question from the quiz.questions array and saving the related quiz. */
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

/*Defining the route for saving a new answer with async / await. 
if the related question does not exist anymore, or given id is invalid,
an appropriate error message is returned. */
questionsRouter.post('/:id/answers', async (request, response) => {

    const body = request.body
    const question = await Question.findById(request.params.id)

    const answer = new Answer({
        title: body.title,
        question: question.id,
    })

    /*If the question is found from the MongoDB database it is saved
    and the id of the answer is also saved to the question data as
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

