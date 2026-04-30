const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Event = require('./models/Event');
const User = require('./models/User');

dotenv.config({ path: './.env' });

const seedVideoEvent = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/scholarpulse');
        console.log('Connected to DB...');

        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('No admin found. Please create an admin user first.');
            process.exit(1);
        }

        const demoEvent = {
            title: 'Campus Life: The Experience 🎬',
            description: 'Experience the vibrant life at our university through this cinematic promo! Join us for a full day of workshops, social gatherings, and networking. This is a special event with video preview support.',
            date: 'Oct 25, 2026',
            time: '10:00 AM - 04:00 PM',
            location: 'University Amphitheatre',
            category: 'Social',
            image: 'https://images.unsplash.com/photo-1523050335456-c6bb749aa497?auto=format&fit=crop&q=80&w=1000',
            video: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
            isFeatured: true,
            author: admin._id
        };

        await Event.create(demoEvent);
        console.log('Demo event with video created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding event:', error);
        process.exit(1);
    }
};

seedVideoEvent();
