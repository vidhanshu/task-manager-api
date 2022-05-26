const express = require('express')

/* connecting to the database */
require("./db/mongoose");

const app = express();

// app.use((req, res, next) => {
//     res.status(503).send("Site is currently down. Check back soon!");
// })

/*
 * without middleware
 * 
 * request -> run route handler
 * 
 * with middleware
 * 
 * request -> do something -> run route handler
 * 
 */

/* importing all the API end points (routes) */
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");

const PORT = process.env.PORT || 3000;

/* to be able to access the req object inside route callback */
app.use(express.json());

/* registering the routers to the current app */
app.use(userRouter)
app.use(taskRouter)

/* listening on port 3000 */
app.listen(PORT, () => {
    console.log("App is ready to listen on port " + PORT)
});

/********************|Experiment purpose|************************/
// const Task = require("./models/task")
// const User = require("./models/user")
// const main = async () => {
//     // const something = await Task.findById('628e0a6696d6f543b6589739');
//     // const user = await something.populate("owner");
//     // console.log(user.owner);

//     // const user = await User.findById("628e1572b061e6dd367992ae");
//     // if(!user){
//     //     return console.log("not exists");
//     // }
//     // await user.populate('tasks');
//     // console.log(user.tasks)
// }

// main()

/* uploading the image experiment */
// const multer = require('multer');

// const avatar = multer({
//     dest: "avatar",
//     limits: {
//         fileSize: 1000000,
//     },
//     fileFilter(req, file, cb) {
//         if (!file.originalname.match(/.(jpg|jpeg|png)$/)) {
//             return cb(new Error('please upload jpg, jpeg or png'));
//         }
//         cb(undefined,true)
//     }
// })

// app.post('/upload/me/avatar', avatar.single('avatar'), (req, res) => {
//     res.send();
// })
/*******************|Experiment purpose|************************/

