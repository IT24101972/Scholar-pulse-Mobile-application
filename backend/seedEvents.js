const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Event = require('./models/Event');

dotenv.config();

const dummyEvents = [
    {
        title: 'Neon Nights Party',
        description: 'Main Square • Tonight 8 PM. Join the biggest neon-themed party on campus!',
        date: 'Oct 17, 2024',
        time: '08:00 PM',
        location: 'Main Square',
        category: 'Social',
        image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=2070&auto=format&fit=crop',
        isFeatured: true,
        baseInterestedCount: 124
    },
    {
        title: 'Deep Learning Workshop',
        description: 'Lab 04 • Wed 10 AM. Learn the fundamentals of Neural Networks and AI.',
        date: 'Oct 20, 2024',
        time: '10:00 AM',
        location: 'Lab 04',
        category: 'Workshops',
        image: 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=1974&auto=format&fit=crop',
        isFeatured: true,
        baseInterestedCount: 45
    },
    {
        title: 'Inter-Uni Cricket Final',
        description: 'Stadium • Saturday. Come support our university team in the grand final!',
        date: 'Oct 23, 2024',
        time: '02:00 PM',
        location: 'Stadium',
        category: 'Sports',
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2067&auto=format&fit=crop',
        isFeatured: true,
        baseInterestedCount: 210
    },
    {
        title: 'Hackathon 2024: Build for Future',
        description: 'Join a 24-hour coding marathon to solve real-world campus problems using AI and IoT technologies.',
        date: 'Oct 24, 2024',
        time: '09:00 AM',
        location: 'Innovation Hub',
        category: 'Workshops',
        image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2070&auto=format&fit=crop',
        isFeatured: false,
        baseInterestedCount: 185
    },
    {
        title: 'Acoustic Guitar Solo Evening',
        description: 'A serene evening of live acoustic performances by the campus music club. Relax and enjoy the music.',
        date: 'Oct 25, 2024',
        time: '06:30 PM',
        location: 'Amphitheater',
        category: 'Social',
        image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=2070&auto=format&fit=crop',
        isFeatured: false,
        baseInterestedCount: 32
    },
    {
        title: 'Annual Career Fair: Meet Top Companies',
        description: 'Connect with over 50 leading companies for internships and job opportunities. Bring your resumes.',
        date: 'Oct 28, 2024',
        time: '10:00 AM',
        location: 'Main Hall',
        category: 'Academic',
        image: 'https://images.unsplash.com/photo-1454165833222-3841963be549?q=80&w=2070&auto=format&fit=crop',
        isFeatured: false,
        baseInterestedCount: 420
    }
];

const seedEvents = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Seeding');

        // Find Admin 1
        const admin = await User.findOne({ email: 'admin1@gmail.com' });
        if (!admin) {
            console.error('Admin 1 not found. Please run seedAdmins.js first.');
            process.exit(1);
        }

        // Clear existing events
        await Event.deleteMany();
        console.log('Cleared existing events');

        // Add author and seed
        const eventsWithAuthor = dummyEvents.map(event => ({
            ...event,
            author: admin._id
        }));

        await Event.insertMany(eventsWithAuthor);
        console.log('Dummy events seeded successfully!');

        process.exit();
    } catch (error) {
        console.error('Error seeding events:', error);
        process.exit(1);
    }
};

seedEvents();
