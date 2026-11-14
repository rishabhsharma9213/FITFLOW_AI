
const mongoose = require("mongoose");

const salesSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true,
        },

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

        qtySold: {
            type: Number,
            required: true,
            min: 0,
        },

        sellingPrice: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Helps retrieve sales by product, branch and date
salesSchema.index({ sku: 1, store: 1, date: 1 });

module.exports = mongoose.model("Sales", salesSchema);
