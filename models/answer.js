//Defining a constant for mongoose.
const mongoose = require('mongoose')

/*Define a schema to use as a model for an Answer object 
to be saved to MongoDB, as well as a refence to Question
object that the answer is related to. */
const answerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title cannot be empty.']
    },
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
    }
})

/*Define the properties of the objects that are returned by the toJSON method.
Exclude the _id value as well as the MongoDB version field __v.
Also transform the value of _id from object to a string */
answerSchema.set("toJSON", {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

//Export the Answer object model.
module.exports = mongoose.model('Answer', answerSchema)
