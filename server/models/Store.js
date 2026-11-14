
const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
    {
        store: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        location: {
            type: String,
            required: true,
        },

        storeType: {
            type: String,
            required: true,
        },

        customerProfile: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Store", storeSchema);
