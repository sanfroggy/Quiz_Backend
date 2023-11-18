//Defining the constants for mongoose and User.
const mongoose = require('mongoose')

/*Define a schema to use as a model for a Blog object 
to be saved to MongoDB, as well as a refence to User
object that created the Blog object in question. */
const questionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title cannot be empty']
    },
    topic: {
        type: String,
        required: [true, 'Topic cannot be empty.']
    },
    correctAnswer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Answer'
    },
    answers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Answer'
        }
    ],
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: [true, 'The question must be related to a quiz.']
    }
})

/*Define the properties of the objects that are returned by the toJSON method.
Exclude the _id value as well as the MongoDB version field __v.
Also transform the value of _id from object to a string */
questionSchema.set("toJSON", {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

//Export the Blog object model.
module.exports = mongoose.model('Question', questionSchema)
