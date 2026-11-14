
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

require("dotenv").config({
    path: path.join(__dirname, "../.env"),
});

const mongoose = require("mongoose");
const connectDB = require("../config/db");

const Inventory = require("../models/Inventory");
const Product = require("../models/Product");
const Sales = require("../models/Sales");
const Store = require("../models/Store");

const DATA_DIR = path.join(__dirname, "../data");

const readCSV = (filename) =>
    new Promise((resolve, reject) => {
        const results = [];

        fs.createReadStream(path.join(DATA_DIR, filename))
            .pipe(csv())
            .on("data", (row) => results.push(row))
            .on("end", () => resolve(results))
            .on("error", reject);
    });

const importRecords = async (Model, operations) => {
    for (let i = 0; i < operations.length; i += 500) {
        await Model.bulkWrite(
            operations.slice(i, i + 500),
            { ordered: false }
        );
    }

    return operations.length;
};

const runImport = async () => {
    try {
        await connectDB();

        console.log("\nStarting FitFlow AI dataset import...\n");

        // PRODUCTS
        const productRows = await readCSV("products.csv");

        const productOperations = productRows.map((row) => ({
            updateOne: {
                filter: { sku: row.sku },
                update: {
                    $set: {
                        sku: row.sku,
                        product: row.product,
                        category: row.category,
                        style: row.style,
                        colour: row.colour,
                        size: row.size,
                        season: row.season,
                        sellingPrice: Number(row.selling_price),
                    },
                },
                upsert: true,
            },
        }));

        console.log("Products processed:", await importRecords(Product, productOperations));

        // STORES
        const storeRows = await readCSV("stores.csv");

        const storeOperations = storeRows.map((row) => ({
            updateOne: {
                filter: { store: row.store },
                update: {
                    $set: {
                        store: row.store,
                        location: row.location,
                        storeType: row.store_type,
                        customerProfile: row.customer_profile,
                    },
                },
                upsert: true,
            },
        }));

        console.log("Stores processed:", await importRecords(Store, storeOperations));

        // INVENTORY
        const inventoryRows = await readCSV("inventory.csv");

        const inventoryOperations = inventoryRows.map((row) => ({
            updateOne: {
                filter: { sku: row.sku, store: row.store },
                update: {
                    $set: {
                        sku: row.sku,
                        store: row.store,
                        stock: Number(row.stock),
                        ageingDays: Number(row.ageing_days),
                    },
                },
                upsert: true,
            },
        }));

        console.log("Inventory processed:", await importRecords(Inventory, inventoryOperations));

        // SALES
        const salesRows = await readCSV("sales.csv");

        const salesOperations = salesRows.map((row) => ({
            updateOne: {
                filter: {
                    date: new Date(row.date),
                    sku: row.sku,
                    store: row.store,
                },
                update: {
                    $set: {
                        date: new Date(row.date),
                        sku: row.sku,
                        store: row.store,
                        qtySold: Number(row.qty_sold),
                        sellingPrice: Number(row.selling_price),
                    },
                },
                upsert: true,
            },
        }));

        console.log("Sales processed:", await importRecords(Sales, salesOperations));

        console.log("\n==================================");
        console.log("FITFLOW AI DATASET IMPORT COMPLETE");
        console.log("==================================");
        console.log("Products:", productRows.length);
        console.log("Stores:", storeRows.length);
        console.log("Inventory:", inventoryRows.length);
        console.log("Sales:", salesRows.length);
        console.log("==================================");

    } catch (error) {
        console.error("\nDataset import failed:", error.message);

        if (error.writeErrors) {
            error.writeErrors.slice(0, 5).forEach((item) => {
                console.error(item.err?.errmsg || item.err?.message);
            });
        }

        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

runImport();
