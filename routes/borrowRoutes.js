const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Book = require('../models/Book');
const router = express.Router();

const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: 'fail',
                message: 'You are not logged in'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                status: 'fail',
                message: 'User no longer exists'
            });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({
            status: 'fail',
            message: 'Invalid token'
        });
    }
};

const restrictToReader = async (req, res, next) => {
    if (req.user.role !== 'reader') {
        return res.status(403).json({
            status: 'fail',
            message: 'Only readers can borrow books'
        });
    }
    next();
};

router.post('/borrow/:bookId', protect, restrictToReader, async (req, res) => {
    try {
        const book = await Book.findById(req.params.bookId);
        const user = await User.findById(req.user.id);

        if (!book) {
            return res.status(404).json({
                status: 'fail',
                message: 'Book not found'
            });
        }

        if (book.availableCopies < 1) {
            return res.status(400).json({
                status: 'fail',
                message: 'Book is not available for borrowing'
            });
        }

        if (user.borrowedBooks.includes(book._id)) {
            return res.status(400).json({
                status: 'fail',
                message: 'You have already borrowed this book'
            });
        }

        if (user.borrowedBooks.length >= 5) {
            return res.status(400).json({
                status: 'fail',
                message: 'You have reached the maximum borrowing limit'
            });
        }

        book.borrowedBy.push({
            user: req.user.id
        });
        book.availableCopies -= 1;
        await book.save();

        user.borrowedBooks.push(book._id);
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Book borrowed successfully',
            data: {
                book: book.title,
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
});

router.post('/return/:bookId', protect, restrictToReader, async (req, res) => {
    try {
        const book = await Book.findById(req.params.bookId);
        const user = await User.findById(req.user.id);

        if (!book) {
            return res.status(404).json({
                status: 'fail',
                message: 'Book not found'
            });
        }

        if (!user.borrowedBooks.includes(book._id)) {
            return res.status(400).json({
                status: 'fail',
                message: 'You have not borrowed this book'
            });
        }

        book.borrowedBy = book.borrowedBy.filter(
            borrow => borrow.user.toString() !== req.user.id
        );
        book.availableCopies += 1;
        await book.save();

        user.borrowedBooks = user.borrowedBooks.filter(
            id => id.toString() !== book._id.toString()
        );
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Book returned successfully'
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
});

router.get('/my-books', restrictToReader, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('borrowedBooks');

        res.status(200).json({
            status: 'success',
            data: {
                books: user.borrowedBooks
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
});

module.exports = router;
