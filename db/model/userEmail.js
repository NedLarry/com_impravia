const mongoose = require('mongoose');
const validator = require('validator')

const EmailSchema = mongoose.Schema({
    EmailAddress: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('invalid email')
            }
        }
    }
})


const emailModel = mongoose.model('Awaitees', EmailSchema);


module.exports = emailModel;