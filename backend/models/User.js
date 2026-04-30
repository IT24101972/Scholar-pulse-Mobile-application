const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please add a full name'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email',
        ],
    },
    studentId: {
        type: String,
        required: [true, 'Please add a student ID'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false, // Do not return password by default
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },
    faculty: {
        type: String,
        enum: ['Computer Science', 'Architecture', 'Business', 'Engineering', 'Other'],
        default: 'Computer Science'
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    avatar: {
        type: String,
        default: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200&auto=format&fit=crop'
    }
}, {
    timestamps: true
});

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
