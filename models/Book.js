const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'A book must have a title'],
        trim: true,
        maxlength: [100, 'Title cannot be longer than 100 characters'],
        minlength: [2, 'Title must be at least 2 characters long']
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A book must have an author']
    },
    isbn: {
        type: String,
        unique: true,
        sparse: true,
        validate: {
            validator: function(isbn) {
                return /^(?:\d{10}|\d{13})$/.test(isbn);
            },
            message: 'ISBN must be either 10 or 13 digits'
        }
    },
    genre: {
        type: String,
        required: [true, 'A book must have a genre'],
        enum: {
            values: [
                'Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 
                'Biography', 'Mystery', 'Romance', 'Fantasy', 'Science Fiction',
                'Horror', 'Thriller', 'Poetry', 'Drama', 'Business', 'Self-Help',
                'Travel', 'Other'
            ],
            message: '{VALUE} is not a supported genre'
        }
    },
    subGenres: [{
        type: String,
        enum: [
            'Literary Fiction', 'Contemporary', 'Historical', 'Adventure',
            'Crime', 'Political', 'Cultural', 'Educational', 'Religious',
            'Cookbook', 'Art', 'Psychology', 'Philosophy', 'Other'
        ]
    }],
    description: {
        type: String,
        required: [true, 'Please provide a book description'],
        maxlength: [2000, 'Description cannot be longer than 2000 characters']
    },
    publishInfo: {
        publisher: String,
        publishDate: Date,
        edition: String,
        language: {
            type: String,
            default: 'English'
        },
        pages: {
            type: Number,
            min: [1, 'Pages must be greater than 0']
        }
    },
    stock: {
        total: {
            type: Number,
            required: [true, 'Please specify the total stock'],
            min: [0, 'Stock cannot be negative']
        },
        available: {
            type: Number,
            min: [0, 'Available stock cannot be negative']
        }
    },
    metadata: {
        keywords: [String],
        targetAudience: {
            type: String,
            enum: ['Children', 'Young Adult', 'Adult', 'All Ages']
        },
        maturityRating: {
            type: String,
            enum: ['G', 'PG', 'PG-13', 'R', 'NC-17']
        }
    },
    ratings: {
        average: {
            type: Number,
            min: [0, 'Rating must be at least 0'],
            max: [5, 'Rating cannot be more than 5'],
            default: 0
        },
        count: {
            type: Number,
            default: 0
        },
        reviews: [{
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'User'
            },
            rating: {
                type: Number,
                required: true,
                min: 1,
                max: 5
            },
            review: String,
            date: {
                type: Date,
                default: Date.now
            }
        }]
    },
    borrowHistory: [{
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        borrowDate: {
            type: Date,
            default: Date.now
        },
        returnDate: Date,
        status: {
            type: String,
            enum: ['active', 'overdue', 'returned'],
            default: 'active'
        }
    }],
    status: {
        type: String,
        enum: ['available', 'limited', 'out_of_stock', 'discontinued'],
        default: 'available'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

bookSchema.index({ title: 'text', 'metadata.keywords': 'text' });
bookSchema.index({ genre: 1, status: 1 });
bookSchema.index({ 'ratings.average': -1 });

bookSchema.pre('save', function(next) {
    if (this.isNew) {
        this.stock.available = this.stock.total;
    }
    next();
});

bookSchema.pre('save', function(next) {
    if (this.stock.available === 0) {
        this.status = 'out_of_stock';
    } else if (this.stock.available <= 3) {
        this.status = 'limited';
    } else {
        this.status = 'available';
    }
    next();
});

bookSchema.virtual('popularityScore').get(function() {
    const borrowWeight = 0.5;
    const ratingWeight = 0.3;
    const reviewWeight = 0.2;

    const borrowScore = this.borrowHistory.length * borrowWeight;
    const ratingScore = (this.ratings.average * this.ratings.count) * ratingWeight;
    const reviewScore = this.ratings.reviews.length * reviewWeight;

    return borrowScore + ratingScore + reviewScore;
});

bookSchema.methods.canBeBorrowed = function() {
    return this.status === 'available' || this.status === 'limited';
};

bookSchema.methods.calculateAverageRating = function() {
    if (this.ratings.reviews.length === 0) return 0;
    
    const totalRating = this.ratings.reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / this.ratings.reviews.length;
};

const Book = mongoose.model('Book', bookSchema);
module.exports = Book;
