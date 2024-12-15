const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true,
        maxlength: [50, 'Name cannot be longer than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false,
        validate: {
            validator: function(password) {
                const hasUpperCase = /[A-Z]/.test(password);
                const hasLowerCase = /[a-z]/.test(password);
                const hasNumbers = /\d/.test(password);
                const hasSpecialChar = /[!@#$%^&*]/.test(password);
                return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
            },
            message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        }
    },
    role: {
        type: String,
        enum: ['reader', 'author', 'admin'],
        default: 'reader'
    },
    profile: {
        avatar: String,
        bio: {
            type: String,
            maxlength: [500, 'Bio cannot be longer than 500 characters']
        },
        location: String,
        website: {
            type: String,
            validate: [validator.isURL, 'Please provide a valid URL']
        }
    },
    readingPreferences: {
        favoriteGenres: [{
            type: String,
            enum: ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Biography', 
                   'Mystery', 'Romance', 'Fantasy', 'Science Fiction', 'Horror', 'Thriller', 
                   'Poetry', 'Drama', 'Business', 'Self-Help', 'Travel', 'Other']
        }],
        preferredLanguages: [String],
        readingGoal: {
            booksPerMonth: {
                type: Number,
                min: [1, 'Reading goal must be at least 1 book per month'],
                max: [50, 'Reading goal cannot exceed 50 books per month']
            }
        }
    },
    borrowedBooks: [{
        book: {
            type: mongoose.Schema.ObjectId,
            ref: 'Book'
        },
        borrowedDate: {
            type: Date,
            default: Date.now
        },
        dueDate: {
            type: Date,
            default: () => new Date(+new Date() + 14*24*60*60*1000)
        },
        returnDate: Date,
        status: {
            type: String,
            enum: ['active', 'overdue', 'returned'],
            default: 'active'
        }
    }],
    writtenBooks: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Book'
    }],
    statistics: {
        totalBooksRead: {
            type: Number,
            default: 0
        },
        totalPagesRead: {
            type: Number,
            default: 0
        },
        averageRating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        readingStreak: {
            type: Number,
            default: 0
        }
    },
    notifications: {
        email: {
            enabled: {
                type: Boolean,
                default: true
            },
            frequency: {
                type: String,
                enum: ['daily', 'weekly', 'monthly'],
                default: 'weekly'
            }
        },
        dueDateReminder: {
            enabled: {
                type: Boolean,
                default: true
            },
            daysBeforeDue: {
                type: Number,
                default: 3
            }
        }
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    accountStatus: {
        type: String,
        enum: ['active', 'suspended', 'deleted'],
        default: 'active'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userSchema.index({ email: 1 });
userSchema.index({ 'readingPreferences.favoriteGenres': 1 });
userSchema.index({ accountStatus: 1, role: 1 });

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.pre('save', function(next) {
    this.lastActive = Date.now();
    next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.canBorrowMore = function() {
    const activeBooks = this.borrowedBooks.filter(book => 
        book.status === 'active' || book.status === 'overdue'
    );
    return activeBooks.length < 5;
};

userSchema.virtual('readingProgress').get(function() {
    if (!this.readingPreferences.readingGoal.booksPerMonth) return 0;
    const booksThisMonth = this.borrowedBooks.filter(book => {
        const borrowedDate = new Date(book.borrowedDate);
        const now = new Date();
        return borrowedDate.getMonth() === now.getMonth() && 
               borrowedDate.getFullYear() === now.getFullYear() &&
               book.status === 'returned';
    }).length;
    return (booksThisMonth / this.readingPreferences.readingGoal.booksPerMonth) * 100;
});

const User = mongoose.model('User', userSchema);
module.exports = User;
