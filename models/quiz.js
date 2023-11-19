//Defining the constants for mongoose and User.
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

/*Define a schema to use as a model for a Blog object 
to be saved to MongoDB, as well as a refence to User
object that created the Blog object in question. */
const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title cannot be empty'],
        unique: [true, 'This title is already in use by another quiz. Quiz titles must be unique.']
    },
    difficulty: {
        type: Number,
        default: 0
    },
    completedAt: {
        type: Number,
        default: 0
    },
    highScore: {
        type: Number,
        default: 0
    },
    highScoreSetBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    ratings: [
        Number
    ],
    questions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        }
    ],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    image: String
})

//Defining the mongoose-unique-validator plugin.
quizSchema.plugin(uniqueValidator)

/*Define the properties of the objects that are returned by the toJSON method.
Exclude the _id value as well as the MongoDB version field __v.
Also transform the value of _id from object to a string */
quizSchema.set("toJSON", {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

//Export the Blog object model.
module.exports = mongoose.model('Quiz', quizSchema)

