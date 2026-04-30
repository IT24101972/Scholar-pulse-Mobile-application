const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Report = require('./models/Report');

dotenv.config();

const seedReports = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        // Find the specific user
        const user = await User.findOne({ email: 'sandarunethsara@gmail.com' });
        
        if (!user) {
            console.error('User sandarunethsara@gmail.com not found. Please register this user first.');
            process.exit(1);
        }

        // Clear existing reports (be careful in production, but okay for dev)
        await Report.deleteMany({});
        console.log('Existing reports cleared.');

        const sampleReports = [
            {
                title: 'Library AC Not Working',
                description: 'The air conditioning in the main study hall on the 2nd floor has been broken since yesterday. It is very difficult to study in this heat.',
                status: 'Pending',
                image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                author: user._id,
                authorEmail: user.email,
                studentId: user.studentId
            },
            {
                title: 'Broken Desk in Lecture Hall A',
                description: 'Desk number 12 in Lecture Hall A has a broken leg and is unusable.',
                status: 'InProgress',
                image: null,
                author: user._id,
                authorEmail: user.email,
                studentId: user.studentId
            },
            {
                title: 'Wi-Fi Down in Hostel Block B',
                description: 'The student Wi-Fi network has been completely unreachable for the past 6 hours.',
                status: 'Resolved',
                image: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                author: user._id,
                authorEmail: user.email,
                studentId: user.studentId
            },
            {
                title: 'Cafeteria Water Leak',
                description: 'There is a major water leak near the entrance of the main cafeteria. It is causing a slipping hazard.',
                status: 'Pending',
                image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                author: new mongoose.Types.ObjectId(), // From another person
                authorEmail: 'another@campus.edu',
                studentId: 'ST99999'
            }
        ];

        await Report.insertMany(sampleReports);
        console.log('Reports seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding reports:', error);
        process.exit(1);
    }
};

seedReports();
