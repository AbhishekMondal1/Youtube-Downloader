import { number, object, string, mixed } from 'yup';

export const querySchema = object({
    id: string().required(),
    format: mixed().oneOf(['video', 'audio']),
    resolution: number().when(
        'format', {
            is: 'video',
            then: number().required()
        }),
})