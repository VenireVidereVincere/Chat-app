const path = require("path")
const express = require("express")
const http = require("http")
const { Server } = require("socket.io");
const { SocketAddress } = require("net");
const { generateMessage } = require("./utils/messages")
const { addUser,getUser,removeUser,getUsersInRoom } = require("./utils/users")

const app = express()
const httpServer = http.createServer(app)
const io = new Server(httpServer)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,"../public")

app.use(express.static(publicDirectoryPath))

io.on("connection",(socket)=>{
    console.log(`New Web Socket Connection!`)

    socket.on("join",({username,room},callback)=>{        
        const {error,user} = addUser({id: socket.id,username,room})
        
        if(!user){
            return callback(error)
        }
        
        socket.join(user.room)
        
    socket.emit("message",generateMessage("Admin",`Welcome, ${username}!`))
    socket.broadcast.to(user.room).emit("message",generateMessage("Admin",`${username} has joined!`))
    io.to(user.room).emit("roomData",{
        room:user.room,
        users:getUsersInRoom(user.room)}
        ) 

    callback()
    })

    socket.on("sendMessage",(message,callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit("message",generateMessage(user.username, message))
        callback()
    })

    socket.on("disconnect",()=>{
        const user = removeUser(socket.id)
        if(user){
        io.to(user.room).emit("message",generateMessage("Admin", `${user.username} has left!`))
        io.to(user.room).emit("roomData",{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        }

    })

    socket.on("sendLocation",(location,callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit("locationMessage",generateMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback()
    })

})

httpServer.listen(port,()=>{
    console.log(`Server is up on port ${port}`)
})


