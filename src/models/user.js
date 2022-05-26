const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const Task = require("./task")

/* schema for user */
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        default: 0,
    },
    email: {
        unique: true,
        type: String,
        required: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Email not valid!");
            }
        }
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
        validate(value) {
            if (value.toLowerCase().includes("password")) {
                throw new Error("password cannot contain 'password'");
            }
        }
    }, avatar: {
        type: Buffer,
    },
    tokens: [
        {
            token:
            {
                type: String,
                required: true
            }
        }
    ]
}, {
    timestamps: true
})



//creating virtual collection to store the tasks related to the user
userSchema.virtual('tasks', {
    ref: "Task",
    localField: "_id",
    foreignField: "owner",
})


/* to not to send the response to the user back with password and tokens array- yes not even to the authenticated user*/
userSchema.methods.toJSON = function () {
    const user = this;
    const obj = user.toObject();
    delete obj.password;
    delete obj.tokens;
    delete obj.avatar;
    return obj;
}

/* generating the auth token */
userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.SECRETE_KEY);
    return token;
}

/* registering the function for checking if the user with given credentials exists or not */
userSchema.statics.findUserByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    /* if user with the given mail doesn't exists */
    if (!user) {
        return false;
    }
    const isPasswordMatching = await bcrypt.compare(password, user.password);
    /* if password doesn't match*/
    if (!isPasswordMatching) {
        return false;
    }

    return user;
}

/**|MIDDLEWARE| Running every time you save the user*** converting the plain text password into hashed one if the password has been updated or newly created */
userSchema.pre('save', async function (next) {
    const user = this;

    if (user.isModified('password')) {
        const hashed = await bcrypt.hash(user.password, 8); //asynchronous operation
        user.password = hashed;
    }
    next();
})

/**|MIDDLEWARE| Running every time you remove the user*** after deleting the user removing all of it's associated tasks */
userSchema.pre('remove', async function (next) {
    const user = this;
    await Task.deleteMany({ owner: user._id });
    next();
})


//creating the User model - and it should be here only don't move it upwards position matters and the reason is you are registering the functions on the schema
const User = mongoose.model('users', userSchema);
module.exports = User;