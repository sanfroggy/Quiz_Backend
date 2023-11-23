/*Defining constants for mongoose, super test and app 
module to be used as "superagent", as well as other necessary
modules. */
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const Quiz = require('../models/quiz')
const User = require('../models/user')


describe('when there is initially some quizzes saved', () => {

    /*Clearing the MongoDB database quiz collection and inserting 
    initialQuizzes array into it. Also clearing the MongoDB database
    User collection and inserting a User into it. */
    beforeEach(async () => {

        await Quiz.deleteMany({})
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', passwordHash })
        const savedUser = await user.save()

        const quizzes = helper.initialQuizzes

        quizzes.forEach(quiz =>
            quiz.author = savedUser.id
        )

        await Quiz.insertMany(helper.initialQuizzes)

    })

    /*Creating a test using async and await to test that
    the correct number of quizzes is returned from MongoDB
    database. */
    test('correct number of quizzes is returned', async () => {

        const response = await api.get('/api/quizzes')

        expect(response.body).toHaveLength(helper.initialQuizzes.length)
    })

    /*Creating a test using async and await to test that
    a id field exists for each of the quizzes instead of an
    _id field. */
    test('the idenfitying field for a quiz is id and not _id', async () => {

        const response = await api.get('/api/quizzes')

        response.body.forEach(quiz => {
            expect(quiz.id).toBeDefined()
        })
    })
})

describe('when a post request is made', () => {

    /*Creating a test using async and await to test that
    a new quiz is added to the database when a post request is
    sent and that the data is in json form. */
    test('quizzes with valid data can be added to the database successfully', async () => {

        const users = await helper.usersInDb()
        const user = users.find(user => user.username === 'root')

        const newQuiz = {
            title: 'Common Knowledge Quiz',
            author: user.id
        }

        const userInfo = {
            username: 'root',
            password: 'sekret'
        }

        const response = await api.post('/api/login').send(userInfo)
        const token = response.body.token

        await api.post('/api/quizzes').send(newQuiz)
            .set('Authorization', `bearer ${token}`)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const quizzesAtEnd = await helper.quizzesInDb()
        expect(quizzesAtEnd).toHaveLength(helper.initialQuizzes.length + 1)

    })

    /*Creating a test using async and await to test that
    if a new quiz is added to the database without having
    a value, having null or undefined for completedAt, that value is set 
    to zero. */
    test('if the added quiz is not given a value for completedAt it is'
        + ' set to zero', async () => {

            const userInfo = {
                username: 'root',
                password: 'sekret'
            }

            const loginResponse = await api.post('/api/login').send(userInfo)
            const token = loginResponse.body.token

        const users = await helper.usersInDb()
        const user = users.find(user => user.username === 'root')

            const newQuiz = {
                title: 'Political Quiz',
                author: user.id,
            }

            let response = await api.post('/api/quizzes').send(newQuiz)
                .set('Authorization', `bearer ${token}`)

            expect(response.body.completedAt).toBe(0)

            const anotherNewQuiz = {
                title: 'Physics Quiz',
                author: user.id,
                completedAt: 30
            }

            response = await api.post('/api/quizzes').send(anotherNewQuiz)
                .set('Authorization', `bearer ${token}`)

            expect(response.body.completedAt).toBe(30)

            const yetAnotherNewQuiz = {
                title: 'Geography Quiz',
                author: user.id,
                completedAt: undefined
            }

            response = await api.post('/api/quizzes').send(yetAnotherNewQuiz)
                .set('Authorization', `bearer ${token}`)

            expect(response.body.completedAt).toBe(0)

            const oneMoreNewQuiz = {
                title: 'TV Quiz',
                author: user.id,
                completedAt: null
            }

        response = await api.post('/api/quizzes').send(oneMoreNewQuiz)
                .set('Authorization', `bearer ${token}`)

            expect(response.body.completedAt).toBe(0)

        })

    /*Creating a test using async and await to test that
    if a new quiz is not given a title, or it has null or 
    undefined value, the response has an approppriate
    400 status code. */
    test('if the added quiz is not given a value for title, a' +
        ' response is invoked with status code 400.', async () => {

        const users = await helper.usersInDb()
        const user = users.find(user => user.username === 'root')

        let newQuiz = {
        }

        const userInfo = {
            username: 'root',
            password: 'sekret'
        }

        const loginResponse = await api.post('/api/login').send(userInfo)
        const token = loginResponse.body.token

            let response = await api.post('/api/quizzes').send(newQuiz)
                .set('Authorization', `bearer ${token}`)
                .expect(400)

            newQuiz = {
                title: null
            }

            response = await api.post('/api/quizzes').send(newQuiz)
                .set('Authorization', `bearer ${token}`)
                .expect(400)

            newQuiz.title = undefined

            response = await api.post('/api/quizzes').send(newQuiz)
                .set('Authorization', `bearer ${token}`)
                .expect(400)

            newQuiz.title = '"Pop" quiz'

            response = await api.post('/api/quizzes').send(newQuiz)
                .set('Authorization', `bearer ${token}`)
                .expect(201)

            response = await api.post('/api/quizzes').send(newQuiz)
                .set('Authorization', `bearer ${token}`)
                .expect(400)

    })

    test('quizzes cannot be added if the token is missing or invalid', async () => {

        const users = await helper.usersInDb()
        const user = users.find(user => user.username === 'root')

        const newBlog = {
            title: 'Game Of Thrones Quiz',
            author: user.id
        }

        const userInfo = {
            username: 'root',
            password: 'sekret'
        }

        const response = await api.post('/api/login').send(userInfo)

        const token = response._body.token

        await api.post('/api/quizzes').send(newBlog).expect(401)

        await api.post('/api/quizzes').send(newBlog)
            .set('Authorization', { token })
            .expect(401)

        await api.post('/api/quizzes').send(newBlog)
            .set('Authorization', 'token')
            .expect(401)

        await api.post('/api/quizzes').send(newBlog)
            .set('Authorization', `bearer ${token}`)
            .expect(201)

    })
})

describe('when there is initially one user at db', () => {

    beforeEach(async () => {

        if (!User.find({ username: 'root' })) {
            const passwordHash = await bcrypt.hash('sekret', 10)
            const user = new User({ username: 'root', name: 'Jarmo Juuri', passwordHash })

            await user.save()
        }

    })

    /*Creating a test using async and await to test that
    a user has been added to MongoDb database and that
    it has the given username. */
    test('creation succeeds with a fresh username', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'SanTheQuizMaster',
            password: 'Apinaz368',
        }

        await api.post('/api/users').send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

        const usernames = usersAtEnd.map(u => u.username)
        expect(usernames).toContain(newUser.username)
    })

    /*Creating a test using async and await to test that
    the correct number of users is returned from MongoDB
    database. */
    test('correct number of users is returned', async () => {

        const response = await api.get('/api/users')

        expect(response.body).toHaveLength(2)
    })
})

describe('when a post request is made to add a user', () => { 

    /*Creating a test using async and await to test that
    the user will not be saved to MongoDB database,
    if the username or password are too short or they are missing
    valid values entirely. Also checking that there are no
    other users in the database with the same name. */
    test('if necessary data is missing or faulty, ' 
        + 'the user cannot be added', async () => {

        let newUser = {
            password: 'Apinaz368'
        }

        let response = await api.post('/api/users').send(newUser).expect(400)
        expect(response.error.text).toContain('Username cannot have an empty value.')

        newUser.username = null

        response = await api.post('/api/users').send(newUser).expect(400)
        expect(response.error.text).toContain('Username cannot have an empty value.')

        newUser.username = undefined

        response = await api.post('/api/users').send(newUser).expect(400)
        expect(response.error.text).toContain('Username cannot have an empty value.')

        newUser.username = 'SN'

        response = await api.post('/api/users').send(newUser).expect(400)
        expect(response.error.text).toContain('Username must contain at least 3 characters.')

        newUser.username = 'San'

        response = await api.post('/api/users').send(newUser).expect(201)

        newUser = {
            username: 'Useri'
        }

        response = await api.post('/api/users').send(newUser).expect(400)
        expect(response.error.text).toContain('Password must have a value of at least 8 characters.')

        newUser.password = null

        response = await api.post('/api/users').send(newUser).expect(400)
        expect(response.error.text).toContain('Password must have a value of at least 8 characters.')

        newUser.password = undefined

        response = await api.post('/api/users').send(newUser).expect(400)
        expect(response.error.text).toContain('Password must have a value of at least 8 characters.')

        newUser.password = 'pw'

        response = await api.post('/api/users').send(newUser).expect(400)
        expect(response.error.text).toContain('Password must have a value of at least 8 characters.')

        newUser.password = 'password'

        response = await api.post('/api/users').send(newUser).expect(201)

        newUser = {
            username: 'SanTheQuizMaster',
            password: 'Jabadabaduu'
        }

        response = await api.post('/api/users').send(newUser).expect(400)
        expect(response.error.text).toContain('expected `username` to be unique')

    }),

    /*Creating a test using async and await to test that
    the quizzes array and user property are defined correctly.
    Also testing that they are filled correctly when populating 
    on receiving a get request. */
    test('user related quizzess and quiz related users are defined and ' +
    'populated correctly.', async () => {
        
        const quizzes = await (await api.get('/api/quizzes')).body

        let userofquizzes = []
        quizzes.forEach(quiz => {
            if (quiz.author !== null && quiz.author !== undefined) {
                if (userofquizzes.length === 0) {
                    userofquizzes[0] = quiz.author
                } else {
                    userofquizzes.concat(quiz.author)
                }              
            }
        })
        const users = await (await api.get('/api/users')).body
        const quizzesofauser = users[0].quizzes
        expect(quizzesofauser).toContainEqual({
            ratings: quizzes[4].ratings,
            id: quizzes[4].id, 
            difficulty: quizzes[4].difficulty,
            title: quizzes[4].title
        })

        expect(quizzesofauser).toHaveLength(helper.initialQuizzes.length + 4)

        expect(userofquizzes).toContainEqual({
            id: users[0].id,
            username: users[0].username
        })

        expect(userofquizzes).toHaveLength(1)
    })
})

//Closing the MongoDB connection.
afterAll(async () => {
    mongoose.connection.close()
})


