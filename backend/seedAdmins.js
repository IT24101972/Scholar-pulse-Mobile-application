const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load environment variables
dotenv.config();

const seedAdmins = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Prepare Admin Accounts Array
        const admins = [
            {
                fullName: 'System Administrator 1',
                email: 'admin1@gmail.com',
                studentId: 'ADMIN-01',
                password: 'admin123',
                role: 'admin',
                isVerified: true
            },
            {
                fullName: 'System Administrator 2',
                email: 'admin2@gmail.com',
                studentId: 'ADMIN-02',
                password: 'admin123',
                role: 'admin',
                isVerified: true
            }
        ];

        // Seed Users Loop
        for (let admin of admins) {
            const userExists = await User.findOne({ email: admin.email });
             
            if (userExists) {
                console.log(`Admin ${admin.email} already exists. Skipping.`);
            } else {
                await User.create(admin);
                console.log(`Admin ${admin.email} created successfully.`);
            }
        }
        
        console.log('Seeding process complete.');
        process.exit();
    } catch (error) {
        console.error('Error with Seeding Admins:', error);
        process.exit(1);
    }
};

seedAdmins();
