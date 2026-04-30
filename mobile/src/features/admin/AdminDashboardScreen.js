import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const AdminDashboardScreen = ({ navigation }) => {
    const ADMIN_ACTIONS = [
        {
            id: 'notices',
            title: 'Notices',
            subtitle: 'Publish & manage campus notices',
            icon: 'megaphone',
            color: '#6366F1',
            bg: '#EEF2FF'
        },
        {
            id: 'complaints',
            title: 'Complaints',
            subtitle: 'Manage & resolve student issues',
            icon: 'warning',
            color: '#EF4444',
            bg: '#FEF2F2'
        },
        {
            id: 'lostfound',
            title: 'Lost & Found',
            subtitle: 'Review & remove student listings',
            icon: 'search',
            color: '#3B82F6',
            bg: '#EFF6FF'
        },
        {
            id: 'events',
            title: 'Events',
            subtitle: '3 flagship events next week',
            icon: 'calendar',
            color: '#10B981',
            bg: '#ECFDF5'
        },
        {
            id: 'resources',
            title: 'Resources',
            subtitle: 'E-Library and Lab schedule updates',
            icon: 'library',
            color: '#8B5CF6',
            bg: '#F5F3FF'
        },
        {
            id: 'clubs',
            title: 'Clubs',
            subtitle: 'Manage clubs, members & requests',
            icon: 'people',
            color: '#F59E0B',
            bg: '#FFFBEB'
        }
    ];

    const getCurrentDate = () => {
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        return new Intl.DateTimeFormat('en-US', options).format(new Date());
    };

    const handlePress = (id) => {
        if (id === 'events') {
            navigation.navigate('AdminEventManagement');
        } else if (id === 'notices') {
            navigation.navigate('AdminNoticeManagement');
        } else if (id === 'clubs') {
            navigation.navigate('AdminClubManagement');
        } else if (id === 'complaints') {
            navigation.navigate('AdminComplaints');
        } else if (id === 'lostfound') {
            navigation.navigate('AdminLostFound');
        } else {
            Alert.alert('Info', `${id.charAt(0).toUpperCase() + id.slice(1)} Management coming soon!`);
        }
    };

    const renderActionCard = (item) => (
        <TouchableOpacity 
            key={item.id} 
            style={styles.card} 
            activeOpacity={0.7}
            onPress={() => handlePress(item.id)}
        >
            <View style={[styles.iconContainer, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Admin Dashboard</Text>
                    <Text style={styles.headerSub}>Manage your campus ecosystem</Text>
                </View>

                {/* Date Header */}
                <View style={styles.dateHeader}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" style={{ marginRight: 8 }} />
                    <Text style={styles.dateText}>{getCurrentDate()}</Text>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statsCard, { borderLeftColor: '#3B82F6' }]}>
                        <Ionicons name="chatbubble" size={20} color="#3B82F6" style={{ marginBottom: 12 }} />
                        <Text style={styles.statsNumber}>24</Text>
                        <Text style={styles.statsLabel}>Active Complaints</Text>
                    </View>
                    <View style={[styles.statsCard, { borderLeftColor: '#10B981' }]}>
                        <Ionicons name="calendar" size={20} color="#10B981" style={{ marginBottom: 12 }} />
                        <Text style={styles.statsNumber}>5</Text>
                        <Text style={styles.statsLabel}>Pending Events</Text>
                    </View>
                </View>

                <Text style={styles.sectionHeading}>Quick Actions</Text>
                {ADMIN_ACTIONS.map(renderActionCard)}
                <View style={{ height: 120 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        marginTop: Platform.OS === 'ios' ? 60 : 120, // Margin instead of padding since it's inside scroll
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1E1B4B',
    },
    headerSub: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
        marginTop: 4,
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    dateText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    statsCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 1,
    },
    statsNumber: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1E1B4B',
    },
    statsLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 4,
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E1B4B',
        marginBottom: 16,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1E1B4B',
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '500',
        color: '#9CA3AF',
        marginTop: 2,
    }
});

export default AdminDashboardScreen;
