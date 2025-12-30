const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const ShippingSetting = require('../models/ShippingSetting');

const defaultShippingRates = [
    { city: 'Kigali', fee: 2000, isDefault: true, isActive: true },
    { city: 'Huye', fee: 5000, isDefault: false, isActive: true },
    { city: 'Musanze', fee: 5000, isDefault: false, isActive: true },
    { city: 'Rubavu', fee: 6000, isDefault: false, isActive: true },
    { city: 'Rusizi', fee: 7000, isDefault: false, isActive: true }
];

async function seedShippingRates() {
    try {
        // Check if shipping rates already exist
        const count = await ShippingSetting.countDocuments();

        if (count > 0) {
            console.log('📦 Shipping rates already seeded');
            return;
        }

        // Insert default rates
        await ShippingSetting.insertMany(defaultShippingRates);
        console.log('✅ Default shipping rates seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding shipping rates:', error);
    }
}

module.exports = seedShippingRates;
