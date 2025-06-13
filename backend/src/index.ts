import express from "express"
import ws, { WebSocket, WebSocketServer } from "ws"
import {v4 as uuid} from "uuid"

const app = express()
const httpserver = app.listen(3000);

const wss = new WebSocketServer({server:httpserver}); //noServer:true

wss.on("connection",function connection(socket){
    (socket as any).id = uuid();
    socket.on('error',console.error);

    socket.on('message',(data,isBinary)=>{
        const senderId = (socket as any).id;
        wss.clients.forEach((client)=>{
            if(client!==socket && client.readyState == WebSocket.OPEN){
                const message = JSON.stringify({
                    senderId,
                    message: data.toString()
                });
                client.send(message,{ binary: isBinary });
            }
        })
    })
    console.log("Connected clients:", wss.clients.size);
    console.log("Listener Count:", wss.listenerCount("connection"));
    socket.send(JSON.stringify({message:'Hello! Message From Server!!'}));
})

wss.once('connection',(data)=>{
    console.log("Ahh!, we got our first user")
})
