import { Request, Response, preResponse } from '../utils/express.util';
import { Folder } from '../models/folder'
import { Endpoint } from '../models/endpoint'
import { Project } from '../models/project'
import { Method } from '../models/method'
import * as encrypt from '../utils/encrypt.util'
import * as verify from './verify.controller'

export const create = async (req: Request, res: Response) => {
    if (await verify.verifyAdmin(req, res) || verify.verifyMember(req, res)) {
        const { folder } = req.body
        const myFolder = await Folder.findById(folder)
        const myMethod = await Method.findOne({ name: 'GET' }, 'id name')
        if (myFolder && myMethod) {
            const endpointId = encrypt.virtualId(4)
            const endpoint = await Endpoint.create({
                _id: endpointId,
                name: 'New Endpoint',
                method: myMethod.id,
                path: `/new-endpoint-${endpointId}`,
                folder: myFolder.id
            })
            endpoint.method = myMethod
            const updateFolder = await Folder.update(folder, { $push: { endpoints: endpoint.id }})
            res.json(preResponse.data(endpoint))
        } else {
            res.json(preResponse.error(null, 'Folder not found'))
        }
    } else {
        res
            .status(401)
            .json(preResponse.error(null, 'Unauth'))
    }
}

export const getById = async (req: Request, res: Response) => {
    if (await verify.verifyAdmin(req, res) || verify.verifyMember(req, res)) {
        const id = req.params.id
        const myEndpoint = await Endpoint.findById(id, 'id name method path folder')
        if (myEndpoint) {
            res.json(preResponse.data(myEndpoint))
        } else {
            res.json(preResponse.error(null, 'Project not found'))
        }
    } else {
        res
            .status(401)
            .json(preResponse.error(null, 'Unauth'))
    }
}

export const update = async (req: Request, res: Response) => {
    if (await verify.verifyAdmin(req, res) || verify.verifyMember(req, res)) {
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

export const search = async (req: Request, res: Response) => {
    if (verify.verifyMember(req, res)) {
        const { project, folder, search, page } = req.query
        const myEndpoints = await Endpoint.search(null, folder, search, 'id method name path')
        const data = {
            endpoints: myEndpoints.slice((page - 1) * 10, page * 10),
            limitPage: Math.ceil(myEndpoints.length / 10)
        }
        res.json(preResponse.data(data))
    } else {
        res
            .status(401)
            .json(preResponse.error(null, 'Unauth'))
    }
}