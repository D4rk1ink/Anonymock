import * as path from 'path'
import * as cors from 'cors'
import * as express from 'express'
import * as mongoose from 'mongoose'
import * as morgan from 'morgan'
import * as bodyParser from 'body-parser'
import * as routes from './routes'
import * as constants from './constants'
import * as initDB from './utils/init-db.util'
import * as encrypt from './utils/encrypt.util'

export class Server {
    public app: express.Application
    public server

    constructor () {
        this.app = express()
        this.start()
    }

    public static bootstrap () {
        return new Server()
    }

    public config () {
        if (process.env.NODE_ENV !== 'test') {
            // this.app.use(morgan(':method :url :status :res[content-length] - :response-time ms'))
        }
        this.app.use(cors())
        this.app.use(bodyParser.json({ limit: '2mb' }))
        this.app.use(bodyParser.urlencoded({ limit: '2mb', extended: true }))
    }

    public mongodb () {
        (<any>mongoose).Promise = Promise
        const connection = mongoose.connect(constants.DB_URL, (err) => {
            if (err) {
                // console.log('Failed to connect to database')
            } else {
                // console.log('Connect to database')
                initDB.createModels()
                initDB.createUsers()
                initDB.createMethods()
            }
        })
    }

    public routes () {
        // this.app.use((req,res,next) => {setTimeout(next,1000)})
        this.app.use('/api', [
            routes.auth,
            routes.user,
            routes.project,
            routes.member,
            routes.method,
            routes.database,
            routes.folder,
            routes.scraper,
            routes.endpoint,
            routes.response,
            routes.log,
            routes.api,
        ])
        this.app.use(express.static(path.join(__dirname, '../public')))
        this.app.get('*', (req, res) => {
            res.sendfile(path.join(__dirname, '../public/index.html'))
        })
    }

    public start () {
        this.mongodb()
        this.config()
        this.routes()
        this.server = this.app.listen(constants.PORT, () => {
            // console.log('START SERVER')
        })
    }

    public close () {
        this.server.close()
    }
}
