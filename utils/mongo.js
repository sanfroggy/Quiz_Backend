/* eslint-disable no-undef */
//Defining dotenv and the constants for the use of Express, cors, Morgan and Contact model
const mongoose = require('mongoose')

//If no password was given, print a message to console and exit program.
if (process.argv.length < 3) {
    console.log('Give password as argument')
    process.exit(1)
}

//Define password and use encodeURIComponent to escape possible special characters.
const password = encodeURIComponent(process.argv[2])

//Define a url to connect to MongoDB.
const url = `mongodb+srv://San:${password}@cluster0.od5jh2q.mongodb.net/testBlogListApp?retryWrites=true&w=majority`

//Set up mongoose and connect to MongoDB.
mongoose.set('strictQuery', false)
mongoose.connect(url)

//Define a schema to use as a model for a Contact object to be saved to MongoDB.
const blogSchema = new mongoose.Schema({
    title: String,
    author: String,
    url: String,
    likes: Number,
})

/*Define the properties of the objects that are returned by the toObject method.
Exclude the _id value as well as the MongoDB version field __v.
Also transform the value of _id from object to a string */
blogSchema.set('toObject', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

const Blog = mongoose.model('Blog', blogSchema)

//Check the command line arguments include a name and a number and add a new Contact to database.
if (process.argv.length === 7) {
    const title = process.argv[3]
    const author = process.argv[4]
    const url = process.argv[5]
    const likes = process.argv[6]

    //Create a new contact with the name and number given as command line arguments.
    const blog = new Blog({
        title: title,
        author: author,
        url: url,
        likes: likes
    })

    //Save the new contact to MongoDB and close the connection.
    blog.save().then(result => {
        console.log(`Added "${result.title}" by ${result.author} with url ${result.url} and ${result.likes} likes to bloglist.`)
        mongoose.connection.close()
    })
}

//Check if the command line arguments contain only password
if (process.argv.length === 3) {

    console.log('Bloglist:')

    //Get and print all contacts from MongoDB.
    Blog.find({}).then(result => {
        result.forEach(blog => {
            console.log(blog.title, blog.author, blog.url, blog.likes)
        })
        mongoose.connection.close()
    })
}
