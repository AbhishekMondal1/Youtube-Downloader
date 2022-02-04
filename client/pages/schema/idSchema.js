import { object, string } from 'yup';

export const idSchema = object({
    id: string().required(),
})