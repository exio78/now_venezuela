const mongoose = require("mongoose");

const ProductoSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  producto: { type: String, required: true },
  farmacia: { type: String, required: true },
  ciudad: { type: String, required: true },
  unidades: { type: Number, required: true },
});

module.exports = mongoose.model("producto", ProductoSchema, "productos");