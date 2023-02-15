const router = require('express').Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User.model');
const isLoggedOut = require('../middleware/route-guard');

router.get('/signup', (req, res) => res.render('auth/signup'));

router.post('/signup', async (req, res, next) => {
 try{
    let {username, password} = req.body; 
    if(!username || !password) {
        res.render('auth/signup', {errorMessage: 'Please input all the fields'});
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await User.create({username, password: hashedPassword});
    res.redirect('/');
 } catch {
    if(error instanceof mongoose.Error.ValidationError) {
        res.render('auth/signup', {
            errorMessage: error.message,
        });
    } else if (error.code === 11000) {
        res.render('auth/signup', {
            errorMessage: 'Email already registered',
        });
    }
    
    console.log(error);
    next(error);
 }
});

router.get('/login', (req, res) => res.render('auth/login'));

router.post('/login', async (req, res , next) => {
    try {
        let {username, password} = req.body;
        if (!username || !password) {
            res.render('auth/login', {errorMessage: 'Please input all the fields'});
        }
        let user = await User.findOne({email});
        if(!user) {
            res.render('auth/login', {errorMessage: 'Account does not exist'});
        } else if (bcrypt.compareSync(password, user.password)) {
            req.session.user = user;
            res.redirect('/profile');
        } else {
            res.render('auth/login', {errorMessage: 'Wrong credentials'});
        }
    } catch (error) {
        console.log(error);
        next(error);
    }
});

router.get('/profile', (req, res, next) => {
    let user = req.session.user;
    res.render('profile', user);
});

router.get('/main', isLoggedOut, (req, res, next) => {
    let data = {layout: false};
    res.render('main', data);
});

router.get('/private', isLoggedOut, (req, res, next) => {
    let user = req.session.user;
    res.render('private', user);
});

router.get('/not-pass', (req, res) => res.render('not-pass'));

router.post('/logout', (req, res, next) => {
    req.session.destroy((err) => {
        if (err) next(err);
        else res.redirect('/');
    });
});

module.exports = router;

