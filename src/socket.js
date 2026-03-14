import { Server } from 'socket.io'
import { createServer } from 'http'
import { app } from './app.js'

const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"]
    }
})


const socketUserMap = {} // {userId: socketId} --- This map will contain all the users that are connected in real time.

const getReceiverSocketId = (userId) => {
    return socketUserMap[userId]
}

io.on("connection", (socket) => {
    console.log(`User with id: ${socket.id} connected`)

    const userId = socket.handshake.query.userId

    //this will assign the socket id of the connected-user as a value to the key of socketUserMap which is the respective userId
    if (userId) socketUserMap[userId] = socket.id

    //io.emit() is used to send the events to all the connected user, they all will have this socketUserMap keys
    io.emit("getOnlineUsers", Object.keys(socketUserMap))

    socket.on("disconnect", () => {
        console.log(`User with id: ${socket.id} disconnected`)

        //On disconnecting the socket, just delete the userid from the socketUserMap
        delete socketUserMap[userId]

        //to let other user know about this deletion emit this
        io.emit("getOnlineUsers", Object.keys(socketUserMap))
    })
})

export { io, server, getReceiverSocketId }