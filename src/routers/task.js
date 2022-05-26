const Router = require("express").Router;
const Task = require('../models/task');
const auth = require("../middleware/auth")

const router = Router();


/* create the task */
router.post("/tasks", auth, async (req, res) => {
    /* adding owner to the task */
    var task = new Task({ owner: req.user._id, ...req.body });

    try {
        /* saving to the database */
        const newTask = await task.save();
        res.status(201).send(newTask);
    } catch (error) {
        res.status(400).send(error);
    }
})

/* read all the tasks created by me */

//GET /tasks?completed=true
//GET /tasks?limit=2&skip=2
//GET /tasks?sortBy=createdAt:asc
router.get("/tasks", auth, async (req, res) => {
    const user = req.user;

    //filtration on the basis of the query - completed
    const match = {};
    //checking if the completed query is given - if given then checking if it is true or false
    (req.query.completed) && (match.completed = (req.query.completed === "true"));

    //sorting object which we gonna pass as a option to options object
    const sort = {};
    //checking if sortBy query exists
    if (req.query.sortBy) {
        const props = req.query.sortBy.split(":");
        sort[props[0]] = (props[1] === "desc") ? -1 : 1;
    }

    try {

        /****|OLD METHOD|****/
        // const tasks = await Task.find({ owner: req.user._id });
        /****|OLD METHOD|****/

        await user.populate({
            path: 'tasks',
            match,
            options: {
                limit: req.query.limit,
                skip: req.query.skip * req.query.limit,
                sort,
            }
        });

        res.send(user.tasks);

    } catch (error) {
        res.status(404).send(error);
    }
})

/* read the single task by id */
router.get("/tasks/:id", auth, async (req, res) => {
    try {
        const _id = req.params.id;
        const task = await Task.findOne({ _id, owner: req.user._id });
        if (!task) {
            return res.status(404).send("Not found!");
        }
        res.send(task);
    } catch (error) {
        res.status(400).send(error)
    }
})


/* update task by id */

router.patch("/tasks/:id", auth, async (req, res) => {

    const requestedUpdates = Object.keys(req.body);
    const allowedUpdates = ['title', 'description', 'completed'];
    const isAllowed = requestedUpdates.every((e) => allowedUpdates.includes(e));

    if (!isAllowed) {
        return res.status(400).send({ error: "This updates are not allowed" });
    }

    try {
        //we are using this two method instead findByIdAndUpdate because findByIdAndUpdate method doesn't uses save() method and we have set the pre middleware for save method 
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id }); //asynchronous
        if (!task) {
            return res.status(404).send("Task doesn't exists");
        }
        allowedUpdates.map(update => task[update] = req.body[update]);

        await task.save(); //asynchronous

        res.status(200).send(task);
    } catch (error) {
        res.status(400).send(error);
    }
})

/* delete task by id */
router.delete("/tasks/:id", auth, async (req, res) => {

    try {

        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        if (!task) {
            return res.status(404).send({ error: "Task with the given query doesn't exist" });
        }
        res.send(task);
    } catch (error) {
        res.status(400).send(error);
    }
})



module.exports = router;