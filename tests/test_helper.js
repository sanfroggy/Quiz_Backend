//Importing the necessary modules.
const Quiz = require('../models/quiz')
const User = require('../models/user')

/*Creating an array of blogs to initialize the MongoDB
database with. */
let initialQuizzes = [
    {
        title: 'Movie Quiz',
        author: null
    },
    {
        title: 'History Quiz',
        author: null
    },
    {
        title: 'Sports Quiz',
        author: null
    },
]

/*Returning an id that is sure not to exist in the 
MongoDB database for testing purposes. */
/*const nonExistingId = async () => {
    const blog = new Quiz({
        title: 'willremovethissoon',
        author: 'nonrelevant',
        url: 'http://www.urlneedstobedefined.com',
        likes: 0
    })
    await blog.save()
    await Blog.findByIdAndRemove(blog._id)

    return blog._id.toString()
}*/

//Return all the blogs in the MongoDB database.
const quizzesInDb = async () => {
    const quizzes = await Quiz.find({})
    return quizzes.map(quiz => quiz.toJSON())
}

//Return all the users in the MongoDB database.
const usersInDb = async () => {
    const users = await User.find({})
    return users.map(usr => usr.toJSON())
}


module.exports = {
    initialQuizzes, /*nonExistingId, */quizzesInDb, usersInDb
}
