import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

export default function LostFoundCard({ item, onContact }) {
    return (
        <View style={styles.card}>
            {/* Item Image at top */}
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            
            {/* Tag and Title */}
            <View style={styles.cardContent}>
                <View style={[styles.tagBadge, { backgroundColor: item.type === 'lost' ? '#FFE8E8' : '#E6F8F0' }]}>
                    <Text style={[styles.tagText, { color: item.type === 'lost' ? '#FF5252' : '#059669' }]}>
                        {item.type === 'lost' ? 'LOST ITEM' : 'FOUND ITEM'}
                    </Text>
                </View>

                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

                {/* Date & Location Grid */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={16} color={theme.colors.textSub} />
                        <Text style={styles.infoText}>{item.date}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={16} color={theme.colors.textSub} />
                        <Text style={styles.infoText}>{item.location}</Text>
                    </View>
                </View>

                {/* Footer: Profile Photo & Contact Button */}
                <View style={styles.cardFooter}>
                    <View style={styles.reporterInfo}>
                        <Image source={{ uri: item.reporter?.avatar || 'https://via.placeholder.com/150' }} style={styles.profileAvatar} />
                        <View style={{ marginLeft: 10 }}>
                            <Text style={styles.reporterLabel}>Reported by</Text>
                            <Text style={styles.reporterName}>{item.reporter?.fullName || 'Unknown User'}</Text>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.contactBtn, { backgroundColor: item.type === 'lost' ? theme.colors.primary : '#059669' }]}
                        onPress={() => onContact(item.phoneNumber)}
                    >
                        <Ionicons name="call-outline" size={18} color={theme.colors.white} />
                        <Text style={styles.contactBtnText}>Contact</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: 24,
        marginHorizontal: 24,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.06,
        shadowRadius: 24,
        elevation: 6,
        overflow: 'hidden',
    },
    cardImage: {
        width: '100%',
        height: 220,
        backgroundColor: '#F3F4FE',
        resizeMode: 'cover',
    },
    cardContent: {
        padding: 20,
    },
    tagBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 12,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.textMain,
        marginBottom: 8,
        lineHeight: 26,
    },
    cardDesc: {
        fontSize: 14,
        color: theme.colors.textSub,
        lineHeight: 22,
        marginBottom: 16,
    },
    infoGrid: {
        backgroundColor: '#F8F9FA',
        padding: 14,
        borderRadius: 12,
        marginBottom: 20,
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        fontSize: 13,
        color: theme.colors.textMain,
        fontWeight: '600',
        marginLeft: 8,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 16,
    },
    reporterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#EBECEF',
    },
    reporterLabel: {
        fontSize: 10,
        color: theme.colors.textSub,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    reporterName: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.textMain,
        marginTop: 2,
    },
    contactBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        marginLeft: 12,
    },
    contactBtnText: {
        color: theme.colors.white,
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 6,
    },
});
