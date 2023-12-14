/*Defining constants for quiz, question and answer models,
express Routers, path, multer middleware and 
userExtractor middleware. */
const quizzesRouter = require('express').Router()
const imagesRouter = require('express').Router()
const Quiz = require('../models/quiz')
const Question = require('../models/question')
const Answer = require('../models/answer')
const { userExtractor } = require('../utils/middleware')
const fs = require('fs')
const path = require('path')

const multer = require('multer');

/*Defining upload variable used for image uploads.
multer.diskStorage is used and the uploads folder
is set as a destination. Fieldname, current date and originalname 
are all saved to the filename. */
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, './controllers/uploads')
        },

        filename: function (req, file, callback) {
            callback(null, file.fieldname + '-' + Date.now() +
                path.extname(file.originalname))
        }
    })
});

/*Defining a route to get an image. A file with the requested
filename from the uploads folder is returned as a response. */
imagesRouter.get('/:fileName', function (request, res) {

    res.sendFile(`./uploads/${request.params.fileName}`, { root: __dirname });
});

/*Defining the route for getting quizzes from MongoDB and
populating their author value with the referred User object's
username. Also populating the highScoreSetBy field and
the question array with the referred question objects titles and topics. */
quizzesRouter.get('/', async (request, response) => {
    const quizzes = await Quiz.find({}).populate('author', { username: 1 })
        .populate('highScoreSetBy', { username: 1 }).populate({
            path: 'questions',
            title: 1, topic: 1
        })
    response.json(quizzes)
})

/*Defining the route for getting a quiz from MongoDB based on
a quiz id and populating it's author value with the referred User object's
username. Also populating the highScoreSetBy field and
the question array with the referred question objects titles and topics
as well as the answers array and correctAnswer field.*/
quizzesRouter.get('/:id', async (request, response) => {
    const quiz = await Quiz.findById(request.params.id).populate('author', { username: 1 })
        .populate('highScoreSetBy', { username: 1 })
        .populate({
            path: 'questions',
            populate: [{ path: 'correctAnswer', title: 1 },
            { path: 'answers', title: 1 }],
            title: 1, topic: 1 })
    response.json(quiz)
})

/*Defining the route for saving a new quiz with async / await, 
unless title has an undefined or a null value. Also using the 
defined middlewares to identify the logged in user by decoding
the jwt authorization token. */
quizzesRouter.post('/', userExtractor, upload.single('image'), async (request, response) => {

    const body = request.body
    const user = request.user

    let quiz = null

    let completedAt = body.completedAt
    let timeLimit = body.timeLimitPerQuestion

    if (!body.completedAt) {
        completedAt = 0
    }

    if (!body.timeLimitPerQuestion) {
        timeLimit = 30
    }

    if (user) { 

        /*Defining the new quiz object and giving it a
        a user._id value to refer to the user who created it. 
        If an image is provided the filename is given as a property
        to it's image field. Otherwise null is given as a value,
        but a default image is requested in the frontend. */
        if (request.file) {
            quiz = new Quiz({
                title: body.title,
                author: user._id,
                image: request.file.filename,
                completedAt: completedAt,
                timeLimitPerQuestion: timeLimit
            })
        } else {
            quiz = new Quiz({
                title: body.title,
                author: user._id,
                image: null,
                completedAt: completedAt,
                timeLimitPerQuestion: timeLimit
            })
        }

        try {

            /*Saving the quiz._id in the quizzes array of the
            user as well and saving the user to the database
            with the quiz._id defined. Returning an error
            message if required data is missing. */
            const savedQuiz = await quiz.save()
            if (user.quizzes.length === 0) {
                user.quizzes = user.quizzes[0] = savedQuiz._id
                await user.save()
            } else {
                user.quizzes = user.quizzes.concat(savedQuiz._id)
                await user.save()
            }

            response.status(201).json(savedQuiz)
        } catch (error) {
            response.status(400).json(error).end()
        }   
    }

})

/*Defining the route for deleting an existing quiz with
async / await, unless the given id is invalid. Returning
an approppriate error message if given an invalid id. */
quizzesRouter.delete('/:id', userExtractor, async (request, response) => {

    /*Using the defined middlewares to identify the logged in user
    by decoding the jtw authorization token and making sure that 
    only the user who has created the quiz, can delete it. Also deleting 
    the image related to the quiz if one is defined. */
    const quizToDelete = await Quiz.findById(request.params.id)

    const user = request.user

    if (user.id.toString() !== quizToDelete.author.toString()) {
        return response.status(401).json({ error: 'Unauthorized.' })
    }

    if (quizToDelete !== null && quizToDelete !== undefined) {

        if (quizToDelete.image !== null && quizToDelete.image !== undefined) {
            const filePath = `${__dirname}/uploads/${quizToDelete.image}`
            console.log(filePath)
            fs.unlink(filePath, (error) => {
                if (error) {
                    response.status(404).json(error).end()
                }
            })
        }

        /*Deleting the quiz with the received id and removing the reference to
        the deleted quiz from the user.quizzes array and saving the user. */
        const index = user.quizzes.indexOf(quizToDelete.id)

        if (index > -1) {
            user.quizzes.splice(index, 1)
        }

        const questions = quizToDelete.questions

        console.log(questions)

        await Answer.deleteMany({ question: { $in: questions } })
        await Question.deleteMany({ quiz: quizToDelete.id.toString() })

        await Quiz.findOneAndRemove(quizToDelete)

        await user.save()

        response.status(204).end()
    } else {
        response.status(400).end()
    }
})

/*Defining the route for updating an existing quiz with
async / await, unless the given id is invalid and 
returning an error message. */
quizzesRouter.put('/:id', async (request, response) => {

    const quizToUpdate = await Quiz.findById(request.params.id)

    if (quizToUpdate !== null && quizToUpdate !== undefined) {
        const body = request.body

        const ratingsTotal = [...body.ratings]
        const average = (ratingsTotal.reduce((a, b) => a + b, 0) / ratingsTotal.length)
        let highScore = quizToUpdate.highScore
        let highScoreSetBy = quizToUpdate.highScoreSetBy

        if (body.score > quizToUpdate.highScore) {
            highScore = body.score
            highScoreSetBy = body.user
        }

        const quiz = {
            title: body.title,
            highScore: highScore,
            highScoreSetBy: highScoreSetBy,
            questions: body.questions,
            author: body.author,
            difficulty: average,
            ratings: ratingsTotal
        }

        const updatedQuiz = await Quiz.findByIdAndUpdate(
            request.params.id, quiz, { new: true })
        response.status(200).json(updatedQuiz)
    } else {
        response.status(404).json({
            error: 'Quiz does not exist. It has possibly been deleted.'
        }).end()
    }
})

/*Defining the route for saving a new question with async / await. 
if the related quiz does not exist anymore, or given id is invalid,
an appropriate error message is returned. */
quizzesRouter.post('/:id/questions', async (request, response) => {

    const body = request.body
    const quiz = await Quiz.findById(request.params.id)

    const question = new Question({
        title: body.title,
        topic: body.topic,
        quiz: quiz.id,
    })

    /*If the quiz is found from the MongoDB database it is saved
    and the id of the question is also saved to the quiz data as
    a reference. */
    if (quiz) {

        try {
            const savedQuestion = await question.save()

            if (quiz.questions.length === 0) {
                quiz.questions = quiz.questions[0] = savedQuestion._id
                await quiz.save()
            } else {
                quiz.questions = quiz.questions.concat(savedQuestion._id)
                await quiz.save()
            }

            response.status(201).json(savedQuestion)
        } catch (error) {
            response.status(400).json(error).end()
        }
    } else {
        response
            .status(404)
            .json({
                error: 'Quiz does not exist. It has possibly been deleted.',
            })
            .end()
    }
})



module.exports = { quizzesRouter, imagesRouter }
