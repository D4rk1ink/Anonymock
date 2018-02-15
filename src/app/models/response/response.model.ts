import { Model, Document, model, Error } from 'mongoose'
import ResponseSchema from './response.schema'
import { Project } from '../project'

interface IResponseModel extends Document {
    id: string
    name: string
    environment: string
    condition: {
        params: any,
        headers: any,
        body: any,
        queryString: any
    }
    response: {
        headers: any,
        body: any,
        delay: number,
        statusCode: number
    }
    endpoint: string
}

const ResponseModel = model<IResponseModel>('Response', ResponseSchema)

export class Response {

    static getModel () {
        return ResponseModel
    }

    static async create (newResponse) {
        return new ResponseModel(newResponse).save()
    }

    static async update (id, update) {
        return await ResponseModel.findByIdAndUpdate(id, update)
    }

    static async remove (id) {
        return await ResponseModel.findByIdAndRemove(id)
    }

    static async findById (id, fields = '') {
        return await ResponseModel.findById(id, fields)
            .populate('method', 'id name')
    }

    static async findOne (condition) {
        return await ResponseModel.findOne(condition)
            .populate('method', 'id name')
    }

    static async findAll (condition = {}, fields = '') {
        return await ResponseModel.find(condition, fields)
    }

    static async search (endpoint, search, fields = '') {
        return await ResponseModel.find({ endpoint: endpoint, name: new RegExp(search, 'gi') }, fields)
    }
}