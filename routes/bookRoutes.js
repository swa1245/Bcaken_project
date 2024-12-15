const express = require('express');
const jwt = require('jsonwebtoken');
const Book = require('../models/Book');
const User = require('../models/User');
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
                message: 'You are not logged in. Please provide a token'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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
        res.status(401).json({
            status: 'fail',
            message: 'Invalid token'
        });
    }
};

const restrictToAuthor = async (req, res, next) => {
    if (req.user.role !== 'author') {
        return res.status(403).json({
            status: 'fail',
            message: 'Only authors can perform this action'
        });
    }
    next();
};

router.post('/create', protect, restrictToAuthor, async (req, res) => {
    try {
        const newBook = await Book.create({
            title: req.body.title,
            author: req.user.id,
            genre: req.body.genre,
            stock: req.body.stock,
            description: req.body.description
        });

        await User.findByIdAndUpdate(req.user.id, {
            $push: { writtenBooks: newBook._id }
        });

        res.status(201).json({
            status: 'success',
            data: {
                book: newBook
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
});

router.get('/', async (req, res) => {
    try {
        const query = {};
        if (req.query.title) {
            query.title = { $regex: req.query.title, $options: 'i' };
        }
        if (req.query.genre) {
            query.genre = req.query.genre;
        }
        if (req.query.author) {
            const author = await User.findOne({ name: { $regex: req.query.author, $options: 'i' } });
            if (author) {
                query.author = author._id;
            }
        }

        const books = await Book.find(query).populate('author', 'name');

        res.status(200).json({
            status: 'success',
            results: Array.isArray(books) ? books.length : 0,
            data: {
                books: Array.isArray(books) ? books : []
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

router.get('/author/:id', protect, restrictToAuthor, async (req, res) => {
    try {
        if (req.params.id !== req.user.id) {
            return res.status(403).json({
                status: 'fail',
                message: 'You can only view your own books'
            });
        }

        const books = await Book.find({ author: req.params.id })
            .populate({
                path: 'borrowedBy.user',
                select: 'name email'
            });

        res.status(200).json({
            status: 'success',
            data: {
                books
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
});

router.put('/update/:id', protect, restrictToAuthor, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({
                status: 'fail',
                message: 'Book not found'
            });
        }

        if (book.author.toString() !== req.user.id) {
            return res.status(403).json({
                status: 'fail',
                message: 'You can only update your own books'
            });
        }

        const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: {
                book: updatedBook
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
});

router.delete('/delete/:id', protect, restrictToAuthor, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({
                status: 'fail',
                message: 'Book not found'
            });
        }

        if (book.author.toString() !== req.user.id) {
            return res.status(403).json({
                status: 'fail',
                message: 'You can only delete your own books'
            });
        }

        await Book.findByIdAndDelete(req.params.id);

        await User.findByIdAndUpdate(req.user.id, {
            $pull: { writtenBooks: req.params.id }
        });

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
});

module.exports = router;
