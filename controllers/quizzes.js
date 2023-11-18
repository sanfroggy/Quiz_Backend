<<<<<<< HEAD
/*Defining constants for blog model,
express Router, blog and user modules and 
userExtractor middleware. */
const quizzesRouter = require('express').Router()
const imagesRouter = require('express').Router()
const Quiz = require('../models/quiz')
const Question = require('../models/question')
const Answer = require('../models/answer')
const { userExtractor } = require('../utils/middleware')
const path = require('path')

const multer = require('multer');

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

imagesRouter.get('/:fileName', function (request, res) {

    res.sendFile(`./uploads/${request.params.fileName}`, { root: __dirname });
});

/*Defining the route for getting blogs from MongoDB and
populating their user value with the referred User object's
username, and name. */
quizzesRouter.get('/', async (request, response) => {
    const quizzes = await Quiz.find({}).populate('author', { username: 1 })
        .populate('highScoreSetBy', { username: 1 })
    response.json(quizzes)
})

/*Defining the route for getting blogs from MongoDB and
populating their user value with the referred User object's
username, and name. */
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

/*Defining the route for saving a new blog with async / await, 
unless title or url have undefined or null values. Also using the 
defined middlewares to identify the logged in user by decoding
the jwt authorization token. */
quizzesRouter.post('/', userExtractor, upload.single('image'), async (request, response) => {
    const body = request.body

    const user = request.user

    /*Defining the new blog object and giving it a
    a user._id value to refer to the user who created it. */
    const quiz = new Quiz({
        title: body.title,
        author: user._id,
        image: request.file.filename,
    })

    /*Saving the blog._id in the blog collection of the
    user as well and saving the user to the database
    with the blog._id defined. Returning an error
    message if required data is missing. */
    if (!quiz.title ) {
        response.status(400).json({
            error: 'Quiz must have a title.'
        }).end()
    } else {
        const savedQuiz = await quiz.save()
        if (user.quizzes.length === 0) {
            user.quizzes = user.quizzes[0] = savedQuiz._id
            await user.save()
        } else {
            user.quizzes = user.quizzes.concat(savedQuiz._id)
            await user.save()
        }

        response.status(201).json(savedQuiz)
    }

})

/*Defining the route for deleting an existing blog with
async / await, unless the given id is invalid. Returning
an approppriate error message if given an invalid id. */
quizzesRouter.delete('/:id', userExtractor, async (request, response) => {

    /*Using the define dmiddlewares to identify the logged in user
    by decoding the jtw authorization token and making sure that 
    only the user who has created the blog, can delete it. */
    const quizToDelete = await Quiz.findById(request.params.id)

    const user = request.user

    if (user.id.toString() !== quizToDelete.author.toString()) {
        return response.status(401).json({ error: 'Unauthorized.' })
    }

    if (quizToDelete !== null && quizToDelete !== undefined) {

        /*Deleting the blog with the received id and removing the reference to
        the deleted blog from the users.blogs array and saving the user. */
        const index = user.blogs.indexOf(quizToDelete.id)

        if (index > -1) {
            user.blogs.splice(index, 1)
        }

        const questions = Question.find({})
        const answers = Answer.find({})

        const questionsIds = questions.map(question => question.id)

        await answers.deleteMany({ question: { $in: questionsIds } })
        await questions.deleteMany({ quiz: quizToDelete.id.toString() })

        await Quiz.findOneAndRemove(quizToDelete)

        await user.save()

        response.status(204).end()
    } else {
        response.status(400).end()
    }
})



/*Defining the route for updating an existing blog with
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

        const updatedBlog = await Quiz.findByIdAndUpdate(
            request.params.id, quiz, { new: true })
        response.status(200).json(updatedBlog)
    } else {
        response.status(404).json({
            error: 'Quiz does not exist. It has possibly been deleted.'
        }).end()
    }
})

/*Defining the route for saving a new comment with async / await. 
if the commented blog does not exist anymore, or given id is invalid,
an appropriate error message is returned. */
quizzesRouter.post('/:id/questions', async (request, response) => {

    const body = request.body
    const quiz = await Quiz.findById(request.params.id)

    const question = new Question({
        title: body.title,
        topic: body.topic,
        quiz: quiz.id,
    })

    /*If the blog is found from the MongoDB database it is saved
    and the id of the comment is also saved to the blog data as
    a reference. */
    if (quiz) {
        const savedQuestion = await question.save()

        if (quiz.questions.length === 0) {
            quiz.questions = quiz.questions[0] = savedQuestion._id
            await quiz.save()
        } else {
            quiz.questions = quiz.comments.concat(savedQuestion._id)
            await quiz.save()
        }

        response.status(201).json(savedQuestion)
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

=======
/*Defining constants for blog model,
express Router, blog and user modules and 
userExtractor middleware. */
const quizzesRouter = require('express').Router()
const imagesRouter = require('express').Router()
const Quiz = require('../models/quiz')
const Question = require('../models/question')
const Answer = require('../models/answer')
const { userExtractor } = require('../utils/middleware')
const fs = require('fs')
const config = require('../utils/config')
const path = require('path')

const multer = require('multer');
const { GridFsStorage } = require("multer-gridfs-storage")

const url = config.MONGODB_URI

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

imagesRouter.get('/:fileName', function (request, res) {

    res.sendFile(`./uploads/${request.params.fileName}`, { root: __dirname });
});


imagesRouter.post('/', upload.single('image'), (request, response) => {

    const file = request.file

    console.log('File:' + request.name)

    console.log('Request body:' + name)

    response.status(201).json({
        message: "Uploaded",
        id: file.id,
        name: file.filename,
        contentType: file.contentType,
    })
});

/*Defining the route for getting blogs from MongoDB and
populating their user value with the referred User object's
username, and name. */
quizzesRouter.get('/', async (request, response) => {
    const quizzes = await Quiz.find({}).populate('author', { username: 1 })
        .populate('highScoreSetBy', { username: 1 })
    response.json(quizzes)
})

/*Defining the route for getting blogs from MongoDB and
populating their user value with the referred User object's
username, and name. */
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

/*Defining the route for saving a new blog with async / await, 
unless title or url have undefined or null values. Also using the 
defined middlewares to identify the logged in user by decoding
the jwt authorization token. */
quizzesRouter.post('/', userExtractor, upload.single('image'), async (request, response) => {
    const body = request.body

    const user = request.user

    /*Defining the new blog object and giving it a
    a user._id value to refer to the user who created it. */
    const quiz = new Quiz({
        title: body.title,
        author: user._id,
        image: request.file.filename,
    })

    /*Saving the blog._id in the blog collection of the
    user as well and saving the user to the database
    with the blog._id defined. Returning an error
    message if required data is missing. */
    if (!quiz.title ) {
        response.status(400).json({
            error: 'Quiz must have a title.'
        }).end()
    } else {
        const savedQuiz = await quiz.save()
        if (user.quizzes.length === 0) {
            user.quizzes = user.quizzes[0] = savedQuiz._id
            await user.save()
        } else {
            user.quizzes = user.quizzes.concat(savedQuiz._id)
            await user.save()
        }

        response.status(201).json(savedQuiz)
    }

})

/*Defining the route for deleting an existing blog with
async / await, unless the given id is invalid. Returning
an approppriate error message if given an invalid id. */
quizzesRouter.delete('/:id', userExtractor, async (request, response) => {

    /*Using the define dmiddlewares to identify the logged in user
    by decoding the jtw authorization token and making sure that 
    only the user who has created the blog, can delete it. */
    const quizToDelete = await Quiz.findById(request.params.id)

    const user = request.user

    if (user.id.toString() !== quizToDelete.author.toString()) {
        return response.status(401).json({ error: 'Unauthorized.' })
    }

    if (quizToDelete !== null && quizToDelete !== undefined) {

        /*Deleting the blog with the received id and removing the reference to
        the deleted blog from the users.blogs array and saving the user. */
        const index = user.blogs.indexOf(quizToDelete.id)

        if (index > -1) {
            user.blogs.splice(index, 1)
        }

        const questions = Question.find({})
        const answers = Answer.find({})

        const questionsIds = questions.map(question => question.id)

        await answers.deleteMany({ question: { $in: questionsIds } })
        await questions.deleteMany({ quiz: quizToDelete.id.toString() })

        await Quiz.findOneAndRemove(quizToDelete)

        await user.save()

        response.status(204).end()
    } else {
        response.status(400).end()
    }
})



/*Defining the route for updating an existing blog with
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

        const updatedBlog = await Quiz.findByIdAndUpdate(
            request.params.id, quiz, { new: true })
        response.status(200).json(updatedBlog)
    } else {
        response.status(404).json({
            error: 'Quiz does not exist. It has possibly been deleted.'
        }).end()
    }
})

/*Defining the route for saving a new comment with async / await. 
if the commented blog does not exist anymore, or given id is invalid,
an appropriate error message is returned. */
quizzesRouter.post('/:id/questions', async (request, response) => {

    const body = request.body
    const quiz = await Quiz.findById(request.params.id)

    const question = new Question({
        title: body.title,
        topic: body.topic,
        quiz: quiz.id,
    })

    /*If the blog is found from the MongoDB database it is saved
    and the id of the comment is also saved to the blog data as
    a reference. */
    if (quiz) {
        const savedQuestion = await question.save()

        if (quiz.questions.length === 0) {
            quiz.questions = quiz.questions[0] = savedQuestion._id
            await quiz.save()
        } else {
            quiz.questions = quiz.comments.concat(savedQuestion._id)
            await quiz.save()
        }

        response.status(201).json(savedQuestion)
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

>>>>>>> 34286c4faf3802d2bf353fa4ee84627f4c3c56f2
