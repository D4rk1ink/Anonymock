import { Request, Response, preResponse } from '../utils/express.util';
import { Folder } from '../models/folder'
import { Project } from '../models/project'
import { Scraper } from '../models/scraper'
import { Endpoint } from '../models/endpoint'
import { Method } from '../models/method'
import { ScraperEndpoint } from '../models/scraper-endpoint'
import { ScraperRequest } from '../models/scraper-request'
import * as encrypt from '../utils/encrypt.util'
import * as verify from './verify.controller'

export const getScraper = async (req: Request, res: Response) => {
    if (await verify.verifyAdmin(req, res) || await verify.verifyMember(req, res)) {
        try {
            const { projectid } = req.headers
            const myScraper = Scraper.findOne({ project: projectid }, 'id baseAPI')
            if (myScraper) {
                res.json(preResponse.data(myScraper))
            } else {
                res.json(preResponse.error(null, 'Scraper not found'))
            }
        } catch (err) { }
    }
}

export const createEndpoint = async (req: Request, res: Response) => {
    if (await verify.verifyAdmin(req, res) || await verify.verifyMember(req, res)) {
        try {
            const { projectid } = req.headers
            const myFolder = await Folder.findOne({ project: projectid })
            const myMethod = await Method.findOne({ name: 'GET' }, 'id name')
            const myScraper = await Scraper.findOne({ project: projectid })
            if (myScraper && myFolder && myMethod) {
                const scraperEndpointId = encrypt.virtualId(4)
                const endpoint = await ScraperEndpoint.create({
                    _id: scraperEndpointId,
                    name: 'New Endpoint',
                    method: myMethod.id,
                    path: `/new-endpoint-${scraperEndpointId}`,
                    folder: myFolder.id,
                    scraper: myScraper.id
                })
                endpoint.method = myMethod
                res.json(preResponse.data(endpoint))
            } else {
                res.json(preResponse.error(null, 'Some thing not found'))
            }
        } catch (err) {
            res.json(preResponse.error(null, 'Create fail'))
        }
    } else {
        res
            .status(401)
            .json(preResponse.error(null, 'Unauth'))
    }
}

export const createRequest = async (req: Request, res: Response) => {
    if (await verify.verifyAdmin(req, res) || await verify.verifyMember(req, res)) {
        try {
            const { endpoint, environment } = req.body
            const scraperRequestId = encrypt.virtualId(5)
            const myEndpoint = await ScraperEndpoint.findById(endpoint)
            if (myEndpoint) {
                const request = await ScraperRequest.create({
                    _id: scraperRequestId,
                    name: 'New Request',
                    environment: environment,
                    endpoint: myEndpoint.id
                })
                const updateEndpoint = await ScraperEndpoint.update(myEndpoint.id, { $push: { requests: request.id }})
                res.json(preResponse.data(request))
            } else {
                res.json(preResponse.error(null, 'Endpoint not found'))
            }
        } catch (err) {
            res.json(preResponse.error(null, 'Create fail' + err))
        }
    } else {
        res
            .status(401)
            .json(preResponse.error(null, 'Unauth'))
    }
}
/*
export const update = async (req: Request, res: Response) => {
    if (await verify.verifyAdmin(req, res) || await verify.verifyMember(req, res)) {
        const id = req.params.id
        const { name, path, method, folder } = req.body
        const findFolder =  await Folder.findById(folder)
        const findMethod =  await Method.findById(method)
        const findEndpoint = await Endpoint.findById(id)
        if (findFolder && findMethod) {
            if (findEndpoint) {
                if (findFolder.id !== findEndpoint.folder) {
                    await Folder.update(findEndpoint.folder, { $pull: { endpoints: findEndpoint.id }}) // remove endpoint from old folder
                    await Folder.update(findFolder.id, { $push: { endpoints: findEndpoint.id }}) // add endpoint to new folder
                }
                await Endpoint.update(id, { name, path, method, folder })
                const myEndpoint = await Endpoint.findById(id)
                res.json(preResponse.data(myEndpoint))
            } else {
                res.json(preResponse.error(null, 'Endpoint not found'))
            }
        } else {
            res.json(preResponse.error(null, 'Folder or method not found'))
        }
    } else {
        res
            .status(401)
            .json(preResponse.error(null, 'Unauth'))
    }
}
*/
export const search = async (req: Request, res: Response) => {
    if (await verify.verifyAdmin(req, res) || await verify.verifyMember(req, res)) {
        const { search, page } = req.query
        const { projectid } = req.headers
        let scraperId = ''
        const myScraper = await Scraper.findOne({ project: projectid })
        if (myScraper) {
            scraperId = myScraper.id
        }
        const endpointsCount = await ScraperEndpoint.search(scraperId, search, page, 'id method folder name path requests').count()
        const endpoints = await ScraperEndpoint.search(search, page, 'id method folder name path requests')
            .skip((page - 1) * 10)
            .limit(10)
        const data = {
            endpoints: endpoints,
            limitPage: Math.ceil(endpointsCount / 10)
        }
        res.json(preResponse.data(data))
    } else {
        res
            .status(401)
            .json(preResponse.error(null, 'Unauth'))
    }
}