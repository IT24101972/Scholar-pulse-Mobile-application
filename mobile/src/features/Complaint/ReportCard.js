import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const StatusBadge = ({ status }) => {
    const getStatusColor = (status) => {
        switch(status) {
            case 'Pending': return theme.colors.statusPending;
            case 'InProgress': return theme.colors.statusInProgress;
            case 'Resolved': return theme.colors.statusResolved;
            default: return theme.colors.textSub;
        }
    };

    const color = getStatusColor(status);
    
    return (
        <View style={[styles.statusBadge, { backgroundColor: color + '1A' }]}>
            <View style={[styles.statusDot, { backgroundColor: color }]} />
            <Text style={[styles.statusText, { color }]}>
                {status === 'InProgress' ? 'In Progress' : status}
            </Text>
        </View>
    );
};

const ReportCard = ({ item, isOwner, onDelete }) => {
    // Date formatting helper
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const formatTime = (dateString) => {
        const options = { hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleTimeString(undefined, options);
    };

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <StatusBadge status={item.status} />
                    {isOwner && (
                        <TouchableOpacity 
                            onPress={() => onDelete(item._id)}
                            style={styles.deleteBtn}
                        >
                            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            <Text style={styles.cardDesc}>{item.description}</Text>
            
            {item.image && (
                <Image source={{ uri: item.image }} style={styles.cardImage} />
            )}
            
            <View style={styles.cardFooter}>
                <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={14} color={theme.colors.textSub} />
                    <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                </View>
                <View style={styles.dateContainer}>
                    <Ionicons name="time-outline" size={14} color={theme.colors.textSub} />
                    <Text style={styles.dateText}>{formatTime(item.createdAt)}</Text>
                </View>
            </View>
        </View>
    );
};

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
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textMain,
        marginRight: 10,
        lineHeight: 22,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    deleteBtn: {
        marginLeft: 12,
        padding: 4,
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
        borderRadius: 12,
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.04)',
        paddingTop: 16,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    dateText: {
        fontSize: 12,
        color: theme.colors.textSub,
        marginLeft: 6,
        fontWeight: '600',
    },
});

export default ReportCard;
