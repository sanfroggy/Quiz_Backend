//Define the use of dotenv.
require('dotenv').config()

//Get the value of the PORT enviromental variable.
const PORT = process.env.PORT

/*Get the password and the username strings from the MONGODB_URI enviromental variable and
use EncodeURIComponent to ensure that special characters will be escaped correctly.
Those string will be then used when forming a URL to connect to. */
const splitfirst = process.env.NODE_ENV === 'test' ?
    process.env.TEST_MONGODB_URI.split(':') :
    process.env.MONGODB_URI.split(':')
const usrindex = splitfirst.indexOf(splitfirst.find(string => string.includes('cluster')))
let usrstring = ''

for (var i = 0; i < usrindex; i++) {
    if (splitfirst.length > 3) {
        if (i === 1) {
            usrstring += '://' + encodeURIComponent(splitfirst[i].substring(2) + ':')
        } else {
            if (i !== usrindex - 1 && i > 0) {
                usrstring += encodeURIComponent(splitfirst[i] + ':')
            } else {
                if (i === usrindex - 1) {
                    usrstring += encodeURIComponent(splitfirst[i]) + ':'
                } else {
                    usrstring += splitfirst[i]
                }
            }
        }
    } else {
        if (i === 1) {
            usrstring += '://' + encodeURIComponent(splitfirst[i].substring(2)) + ':'
        } else {
            if (i > 0) {
                usrstring += encodeURIComponent(splitfirst[i]) + ':'
            } else {
                usrstring += splitfirst[i]
            }
        }
    }
}

const splitsecond = splitfirst[usrindex].split('@')

const pwdindex = splitsecond.indexOf(splitsecond.find(string => string.includes('cluster')))
let encodedstring = ''

for (i = 0; i < pwdindex; i++) {
    if (splitsecond.length > 2) {
        if (i !== pwdindex - 1) {
            encodedstring += encodeURIComponent(splitsecond[i] + '@')
        } else {
            encodedstring += encodeURIComponent(splitsecond[i])
        }
    } else {
        encodedstring += encodeURIComponent(splitsecond[i])
    }
}

//Form an URI to connect by using the different strings.
const MONGODB_URI = `${usrstring}${encodedstring}@${splitsecond[pwdindex]}`

//Export the values of the MONGODB_URI and PORT variables.
module.exports = {
    MONGODB_URI,
    PORT
}
