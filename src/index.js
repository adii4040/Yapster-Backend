import dotenv from 'dotenv'
dotenv.config({ path: '.env' })

import express from 'express'
import { server } from './socket.js'
import { app } from './app.js'
import { connectDb } from './DB/db.js'
import path from 'path'

const port = process.env.PORT || 8080

const __dirname = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
  });
}


connectDb()
    .then(() => {
        app.on('error', (err) => {
            console.log(`Connection err ${err}`)
            throw new Error
        })
        server.listen(port, () => console.log(`⚙️ Server successfully running on port:${port}`))
    })
    .catch((err) => console.log(`Error connecting database ERROR:${err}`))


