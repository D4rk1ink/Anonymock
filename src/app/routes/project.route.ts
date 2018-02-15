import * as express from 'express'
import * as auth from '../controllers/auth.controller'
import * as project from '../controllers/project.controller'

const routerIndex = express.Router()
const router = express.Router()

router.get('/', project.getAll)
router.get('/:id', project.getById)
router.post('/', project.create)

routerIndex.use('/project', auth.verify, router)

export default routerIndex