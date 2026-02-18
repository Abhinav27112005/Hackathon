import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import connectDb from './config/db';

const PORT = Number(process.env.PORT) || 5000;
connectDb().then(() => {
    app.listen(PORT, () => {
        console.log(`
    ╔═══════════════════════════════════════╗
    ║   🏛️  NITI-SETU API SERVER            ║
    ║   Port: ${PORT}                       ║
    ║   ENV:  ${process.env.NODE_ENV}       ║
    ║   URL:  ${process.env.CLIENT_URL}     ║
    ╚═══════════════════════════════════════╝
    `);
    })
})

