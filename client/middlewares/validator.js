import { querySchema } from "../schema/querySchema";

export function validator(querySchema, handler) {
    return async(req, res) => {
        try {
            await querySchema.validate(req.query);
        } catch (error) {
            return res.status(400).json(error);
        }
        await handler(req, res);
    }
}