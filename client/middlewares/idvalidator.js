import { idSchema } from "../schema/idSchema";

export function idvalidator(idSchema, handler) {
    return async(req, res) => {
        try {
            await idSchema.validate(req.query);
        } catch (error) {
            return res.status(401).json(error);
        }
        await handler(req, res);
    }
}