import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

export default function EventCard({ item, onPress, onToggleInterest, getImageUrl, currentUserId }) {
    const isInterested = item.interestedUsers?.includes(currentUserId);

    return (
        <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{item.category}</Text>
                </View>
            </View>
            <Text style={styles.cardDesc}>{item.description}</Text>

            <Image
                source={{ uri: getImageUrl(item.image) }}
                style={styles.cardImage}
            />

            <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                    <Ionicons name="calendar-outline" size={14} color={theme.colors.textSub} />
                    <Text style={styles.footerText}>{item.date}</Text>
                </View>
                <View style={[styles.footerItem, { marginLeft: 12 }]}>
                    <Ionicons name="people-outline" size={14} color={theme.colors.textSub} />
                    <Text style={styles.footerText}>
                        {(item.baseInterestedCount || 0) + (item.interestedUsers?.length || 0)}+ Interested
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.interestedActionBtn, isInterested && { backgroundColor: '#FEE2E2' }]}
                    onPress={() => onToggleInterest(item._id)}
                >
                    <Ionicons
                        name={isInterested ? "heart" : "heart-outline"}
                        size={20}
                        color={isInterested ? "#EF4444" : "#6B7280"}
                    />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 24,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: '800',
        color: theme.colors.textMain,
        marginRight: 10,
        lineHeight: 24,
    },
    categoryBadge: {
        backgroundColor: '#10B9811A',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    categoryBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#10B981',
        textTransform: 'uppercase',
    },
    cardDesc: {
        fontSize: 14,
        color: theme.colors.textSub,
        lineHeight: 20,
        marginBottom: 16,
    },
    cardImage: {
        width: '100%',
        height: 180,
        borderRadius: 14,
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.04)',
        paddingTop: 16,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    footerText: {
        fontSize: 12,
        color: theme.colors.textSub,
        marginLeft: 6,
        fontWeight: '600',
    },
    interestedActionBtn: {
        marginLeft: 'auto',
        backgroundColor: '#F3F4FE',
        padding: 8,
        borderRadius: 10,
    }
});
