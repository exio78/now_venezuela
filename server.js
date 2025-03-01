require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(express.json());
app.use(bodyParser.json()); // Manejo de JSON en solicitudes

// Configuración de ManyChat
const MANYCHAT_API_URL = "https://api.manychat.com/fb/";
const MANYCHAT_ACCESS_TOKEN = process.env.MANYCHAT_ACCESS_TOKEN;

// Configurar instancia de Axios para ManyChat
const manyChatRequest = axios.create({
    baseURL: MANYCHAT_API_URL,
    headers: { 'Authorization': `Bearer ${MANYCHAT_ACCESS_TOKEN}` }
});

// 📌 1. Webhook para recibir eventos de ManyChat
app.post('/webhook', (req, res) => {
    console.log("Evento recibido desde ManyChat:", req.body);
    
    // Procesar evento según el tipo
    if (req.body.type === "new_subscriber") {
        console.log(`Nuevo suscriptor: ${req.body.subscriber_id}`);
    } else if (req.body.type === "keyword") {
        console.log(`Palabra clave recibida: ${req.body.data.keyword}`);
    }

    res.status(200).send("OK");
});

// 📌 2. Obtener información de un suscriptor
app.get('/subscriber/:id', async (req, res) => {
    try {
        const response = await manyChatRequest.get(`subscriber/getInfo?subscriber_id=${req.params.id}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📌 3. Enviar un mensaje a un suscriptor
app.post('/send-message', async (req, res) => {
    try {
        const { subscriber_id, message } = req.body;
        const response = await manyChatRequest.post('sending/sendContent', {
            subscriber_id,
            message: { text: message, type: "text" }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📌 4. Responder automáticamente a eventos de ManyChat
app.post('/auto-response', async (req, res) => {
    try {
        const { subscriber_id, message } = req.body;
        console.log(`Respondiendo automáticamente a ${subscriber_id}: ${message}`);

        const response = await manyChatRequest.post('sending/sendContent', {
            subscriber_id,
            message: { text: message, type: "text" }
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en el puerto ${PORT}`));