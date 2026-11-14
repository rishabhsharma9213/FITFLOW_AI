
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        sku: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        product: {
            type: String,
            required: true,
        },

        category: {
            type: String,
            required: true,
        },

        style: {
            type: String,
        },

        colour: {
            type: String,
        },

        size: {
            type: String,
            enum: ["M", "L", "XL", "XXL", "3XL", "4XL", "5XL"],
            required: true,
        },

        season: {
            type: String,
        },

        sellingPrice: {
            type: Number,
            min: 0,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Product", productSchema);

