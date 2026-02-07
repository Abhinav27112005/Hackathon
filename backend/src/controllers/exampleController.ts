import { Request, Response } from 'express';

export const exampleController = {
    // GET example
    getExample: async (req: Request, res: Response) => {
        try {
            res.json({
                success: true,
                message: 'Example GET endpoint',
                data: {
                    id: 1,
                    name: 'NitiSetu',
                    description: 'Example data from NitiSetu API'
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // POST example
    createExample: async (req: Request, res: Response) => {
        try {
            const { name, description } = req.body;

            // TODO: Add your database logic here

            res.status(201).json({
                success: true,
                message: 'Example created successfully',
                data: {
                    id: Math.floor(Math.random() * 1000),
                    name,
                    description,
                    createdAt: new Date()
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
