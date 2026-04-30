const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const LostFoundItem = require('./models/LostFoundItem');
const VaultItem = require('./models/VaultItem');

dotenv.config();

const seedLostFound = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        // 1. Clear Existing Data
        await LostFoundItem.deleteMany({});
        await VaultItem.deleteMany({});
        console.log('Cleared existing LostFoundItems and VaultItems.');

        // 2. Set up dummy users
        const dummyUsersData = [
            {
                fullName: 'Piumi Fernando',
                email: 'st1@gmail.com',
                studentId: 'ST10001',
                password: 'sandaru123',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
                isVerified: true
            },
            {
                fullName: 'Kavindu Perera',
                email: 'st2@gmail.com',
                studentId: 'ST10002',
                password: 'sandaru123',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
                isVerified: true
            },
            {
                fullName: 'Nimesh Silva',
                email: 'st3@gmail.com',
                studentId: 'ST10003',
                password: 'sandaru123',
                avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop',
                isVerified: true
            }
        ];

        let createdUsers = {};
        for (const data of dummyUsersData) {
            let u = await User.findOne({ email: data.email });
            if (!u) {
                u = await User.create({
                    fullName: data.fullName,
                    email: data.email,
                    studentId: data.studentId,
                    password: data.password, 
                    avatar: data.avatar,
                    isVerified: true
                });
                console.log(`Created user: ${data.fullName}`);
            } else {
                u.avatar = data.avatar;
                await u.save();
                console.log(`User ${data.fullName} already exists.`);
            }
            createdUsers[data.email] = u;
        }

        // 3. Find Sandaru and create separate Vault Items
        let sandaru = await User.findOne({ email: 'sandarunethsara@gmail.com' });
        if (!sandaru) {
            sandaru = await User.create({
                fullName: 'Sandaru Nethsara',
                email: 'sandarunethsara@gmail.com',
                studentId: 'ST00000',
                password: 'sandaru123',
                avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200&auto=format&fit=crop',
                isVerified: true
            });
        }

        const vaultItems = [
            { 
                title: 'MacBook Pro 14"', 
                subtext: 'Silver • M2 Chip', 
                image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=400&auto=format&fit=crop',
                user: sandaru._id
            },
            { 
                title: 'Blue Backpack', 
                subtext: 'Everlane • Nylon', 
                image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=400&auto=format&fit=crop',
                user: sandaru._id
            }
        ];
        
        await VaultItem.insertMany(vaultItems);
        console.log('Created separate Vault Items for Sandaru.');

        // 4. Save Dummy Lost & Found Posts
        const dummyPosts = [
            {
                type: 'lost',
                title: 'Apple AirPods Pro',
                description: 'Lost my AirPods in the Library 2nd floor, near the IT section. They are in a white case with a small scratch on the back.',
                date: 'Oct 24, 2023',
                location: 'Main Library, 2nd Floor',
                image: 'https://images.unsplash.com/photo-1608156639585-b3a032ef9689?q=80&w=600&auto=format&fit=crop',
                phoneNumber: '+94 77 123 4567',
                reporter: sandaru._id
            },
            {
                type: 'found',
                title: 'Casio Scientific Calculator',
                description: 'Found this scientific calculator left on a desk in Lecture Hall C. Handed it over to the security desk at the building entrance.',
                date: 'Oct 23, 2023',
                location: 'Lecture Hall C',
                image: 'https://images.unsplash.com/photo-1596484552834-6a58f850d0a5?q=80&w=600&auto=format&fit=crop',
                phoneNumber: '+94 76 987 6543',
                reporter: createdUsers['st2@gmail.com']._id // Kavindu
            },
            {
                type: 'lost',
                title: 'Hostel Keys with Keychain',
                description: 'Lost a set of 2 keys attached to a Spider-Man keychain. Likely dropped somewhere near the main cafeteria.',
                date: 'Oct 22, 2023',
                location: 'Main Cafeteria / Walkway',
                image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?q=80&w=600&auto=format&fit=crop',
                phoneNumber: '+94 71 456 7890',
                reporter: createdUsers['st1@gmail.com']._id // Piumi
            },
            {
                type: 'found',
                title: 'Blue Water Bottle (CamelBak)',
                description: 'Found a blue CamelBak water bottle at the stadium bleachers after the evening match.',
                date: 'Oct 21, 2023',
                location: 'University Stadium',
                image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=600&auto=format&fit=crop',
                phoneNumber: '+94 72 345 6789',
                reporter: createdUsers['st3@gmail.com']._id // Nimesh
            }
        ];

        await LostFoundItem.insertMany(dummyPosts);
        console.log('Successfully seeded LostFoundItems data!');

        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedLostFound();
