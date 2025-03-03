require("dotenv").config();
const express = require("express");
const connectDB = require("./db");
const Producto = require("./models/Producto");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

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

// Conectar a MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// 1. Endpoint para consultar un producto por ciudad
app.post("/consulta-producto", async (req, res) => {
  try {
    const { subscriber_id, producto, ciudad } = req.body;

    if (!subscriber_id || !producto || !ciudad) {
      return res.status(400).json({ success: false, message: "Faltan datos" });
    }

    // Buscar todas las farmacias que tienen el producto en la ciudad
    const farmacias = await Producto.find({ producto, ciudad });

    if (farmacias.length > 0) {
      const listaFarmacias = farmacias.map(f => ({ nombre: f.farmacia }));

      return res.json({
        success: true,
        message: "Farmacias disponibles en la ciudad.",
        farmacias: listaFarmacias
      });
    } else {
      return res.json({
        success: false,
        message: "No contamos con el producto en esa ciudad.",
        farmacias: []
      });
    }
  } catch (error) {
    console.error("Error en /consulta-producto:", error);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// 2. Endpoint para listar todos los productos
app.get("/productos", async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (error) {
    console.error("Error en /productos:", error);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// 3. Webhook para recibir eventos de ManyChat
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

// 4. Obtener información de un suscriptor
app.get('/subscriber/:id', async (req, res) => {
    try {
        const response = await manyChatRequest.get(`subscriber/getInfo?subscriber_id=${req.params.id}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. Enviar un mensaje a un suscriptor
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

// 6. Responder automáticamente a eventos de ManyChat
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

app.get('/', (req, res) => {
  res.send('Bienvenido');
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en el puerto ${PORT}`));