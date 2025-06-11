import { error } from "console";
import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

function broadcast(message: string) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

wss.on('connection', (socket: WebSocket) => {
    broadcast(`New user joined. Total no of users are: ${wss.clients.size}`);

    socket.on("message", (message: string) => {
        broadcast(message.toString());
    })

    socket.on('close', () => {
        broadcast(`User left the chat. Total no of users are: ${wss.clients.size}`);
    })

    socket.on('error', (error) => {
        console.error("Error encountered.", error);
    })
})

console.log("WebSocketServer is running on: 8080");