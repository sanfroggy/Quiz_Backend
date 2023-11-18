//Defining the constant for mongoose and mongoose-unique-validator.
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

/*Define a schema to use as a model for a User object 
to be saved to MongoDB, as well as a refence to Blog
objects created by that user. Using validation to
make sure that a username is provided and it has ai minimum of 
3 characters. */
const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username cannot have an empty value.'],
        minlength: [3, 'Username must contain at least 3 characters.'],
        unique: [true, 'Username is already in use.']
    },
    passwordHash: String,
    quizzes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quiz'
        }
    ],
})

//Defining the mongoose-unique-validator plugin.
userSchema.plugin(uniqueValidator)

/*Define the properties of the objects that are returned by the toJSON method.
Exclude the _id value as well as the MongoDB version field __v and the 
passwordHash. Also transform the value of _id from object to a string */
userSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
        delete returnedObject.passwordHash
    }
})

const User = mongoose.model('User', userSchema)

module.exports = User
