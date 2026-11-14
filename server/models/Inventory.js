
const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
    {
        sku: {
            type: String,
            required: true,
            trim: true,
        },

        store: {
            type: String,
            required: true,
            trim: true,
        },

        stock: {
            type: Number,
            required: true,
            min: 0,
        },

        ageingDays: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

inventorySchema.index(
    { sku: 1, store: 1 },
    { unique: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);
