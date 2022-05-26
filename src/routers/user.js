const Router = require("express").Router;
const User = require('../models/user');
const auth = require("../middleware/auth")

const router = Router();
const multer = require('multer');
const sharp = require('sharp')

const avatar = multer({
    // dest: "avatars",
    limits: {
        fileSize: 1000000,
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/.(jpg|jpeg|png)$/)) {
            cb(new Error("Upload jpeg , png or jpeg <1mb"));
        }
        cb(undefined, true);
    }
})
/* upload user profile */
router.post('/upload/me/avatar', auth, avatar.single('avatar'), async (req, res) => {

    //formatting image
    const image = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    //saving the image
    const user = req.user;
    user.avatar = image;
    await user.save();
    res.send('done')
    
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
})


/* delete profile pic */
router.delete('/delete/me/avatar', auth, async (req, res) => {
    const user = req.user;
    user.avatar = undefined;
    await user.save();
    res.send('deleted!');
})

/* serving the profile through url */
router.get("/users/:id/avatar", async (req, res) => {
    try {
        //fetching the user with the id
        const user = await User.findById(req.params.id);
        //if profile or profile image doesn't exists
        if (!user || !user.avatar) {
            throw new Error("Profile doesn't exists!");
        }
        //type of the content
        res.set('Content-Type', "image/png");//this is not necessary to set if you forget to set up the express will automatically set up for you
        //sending the image as a response
        res.send(user.avatar);
    } catch (error) {
        res.status(400).send({ error })
    }

})

/* creating the user - sign up*/
router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        const token = await user.generateAuthToken();
        user.tokens = user.tokens.concat({ token });
        const newUser = await user.save();

        res.status(201).send({ newUser, token });
    } catch (error) {
        res.status(500).send(error);
    }

})

/* login in the user */
router.post("/users/login", async (req, res) => {
    /* finding the credentials if exists in the database or not */
    const user = await User.findUserByCredentials(req.body.email, req.body.password);
    /* in the below line it is necessary to return otherwise ii will keep running the further function */
    if (!user) {
        return res.status(401).send("Wrong credentials!");
    }
    /* generating the token for the current user */
    const token = await user.generateAuthToken();
    /* adding the toke to the tokens array in the database */
    user.tokens.push({ token });
    /* saving the user to the database */
    const newUser = await user.save();
    /* sending response back without private data like - password and tokens array */
    res.send({ user: newUser, token })
})

/* user logout */
router.post("/users/logout", auth, async (req, res) => {
    try {
        const user = req.user;
        const tokenThatGotRemoved = user.tokens.splice(user.tokens.indexOf({ token: req.currentUserToken }), 1)
        res.send(tokenThatGotRemoved);
        await user.save();
    } catch (error) {
        res.status(500).send(error);
    }
})

/* logging out from all the devices */
router.post("/users/logoutAll", auth, async (req, res) => {
    try {
        const user = req.user;
        user.tokens = [];
        await user.save();
        res.send("Successfully logged out from all the devices!")
    } catch (error) {
        res.status(500).send(error);
    }
})

/* getting my profile  data */
router.get("/users/me", auth, async (req, res) => {
    try {
        /* sending response back without private data like - password and tokens array */
        res.send({ user: req.user });
    } catch (error) {
        res.status(404).send(error);
    }
})

/* updating my data in the database*/
router.patch("/users/me", auth, async (req, res) => {


    const requestedUpdates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'age', 'password'];
    isAllowed = requestedUpdates.every(e => allowedUpdates.includes(e));

    if (!isAllowed) {
        return res.status(400).send({ error: "This updates are not allowed" });
    }

    try {
        /*we are using this two method instead findByIdAndUpdate because findByIdAndUpdate method doesn't uses save() method and we have set the pre middleware for save method */

        /* if exists doing the required changes */
        requestedUpdates.map(update => req.user[update] = req.body[update])

        /* saving so that middleware will run */
        await req.user.save();

        res.send({ user: req.user });
    } catch (error) {
        res.status(400).send(error);
    }
})


/* delete my account*/
router.delete("/users/me", auth, async (req, res) => {
    try {
        /* removing the user from the database */
        await req.user.remove();
        /* sending the current user back as a response */
        res.send({ user: req.user });
    } catch (error) {
        res.status(400).send();
    }
})


module.exports = router;