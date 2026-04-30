import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ScrollView, Image, ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { theme } from '../../theme/theme';
import { BASE_URL } from '../../config/api';

const FACULTIES = [
    { key: 'All',         label: 'All Notices',  icon: 'list',           color: '#0055FE' },
    { key: 'Computing',   label: 'Computing',    icon: 'desktop-outline', color: '#6366F1' },
    { key: 'Business',    label: 'Business',     icon: 'briefcase-outline', color: '#10B981' },
    { key: 'Engineering', label: 'Engineering',  icon: 'construct-outline', color: '#F59E0B' },
    { key: 'Law',         label: 'Law',          icon: 'scale-outline',    color: '#EC4899' },
];

const TYPE_CONFIG = {
    urgent: { color: '#EF4444', icon: 'megaphone',     label: 'URGENT' },
    general: { color: '#0055FE', icon: 'document-text', label: 'NOTICE' },
    event:  { color: '#10B981', icon: 'calendar',       label: 'EVENT' },
    admin:  { color: '#F59E0B', icon: 'shield-checkmark', label: 'ADMIN' },
};

const FALLBACK_NOTICES = [
    {
        _id: 'f1',
        type: 'urgent',
        faculty: 'All',
        title: 'End Semester Examination Schedule Revised',
        description: 'The final examination dates for the Fall 2024 semester have been updated due to the upcoming national holidays. Please check the revised timetable.',
        attachment: 'REVISED_EXAM_2024.PDF',
        isImportant: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
        _id: 'f2',
        type: 'general',
        faculty: 'Computing',
        title: 'Software Engineering Module Update',
        description: 'The module outline for CS4032 has been revised. The new syllabus includes Cloud Computing and DevOps practicals. Please download the updated guide.',
        attachment: 'CS4032_OUTLINE.PDF',
        isImportant: false,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
        _id: 'f3',
        type: 'event',
        faculty: 'Business',
        title: "Annual Business Symposium 'Nexus 2024' Open for Registration",
        description: 'Join Sri Lanka\'s largest undergraduate business conference. Present your case studies and win exciting prizes. Register before May 15th.',
        image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800',
        isImportant: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        _id: 'f4',
        type: 'general',
        faculty: 'Engineering',
        title: 'Laboratory Safety Induction – Mandatory Attendance',
        description: 'All Engineering Year 1 and Year 2 students must attend the mandatory lab safety induction session on April 25th at the Civil Engineering Building.',
        isImportant: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        _id: 'f5',
        type: 'admin',
        faculty: 'Law',
        title: 'Moot Court Competition – Application Window Open',
        description: 'Applications for the Annual Inter-Faculty Moot Court Competition are now open. Submit your written submissions at the Faculty of Law office by April 28th.',
        isImportant: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        _id: 'f6',
        type: 'urgent',
        faculty: 'All',
        title: 'Library System Maintenance – April 22',
        description: 'The online library portal and e-resources will be unavailable on April 22nd from 11 PM to 4 AM for scheduled maintenance.',
        isImportant: true,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
};

export default function HomeScreen() {
    const [selectedFaculty, setSelectedFaculty] = useState('All');
    const [notices, setNotices]       = useState([]);
    const [isLoading, setIsLoading]   = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [useFallback, setUseFallback]   = useState(false);

    const fetchNotices = useCallback(async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true);
        else setIsLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/notices`, { timeout: 8000 });
            const data = res.data?.data || [];
            setNotices(data);
            setUseFallback(false);
        } catch {
            setNotices(FALLBACK_NOTICES);
            setUseFallback(true);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchNotices(); }, [fetchNotices]);

    // Filter by selected faculty
    const filtered = notices.filter(n => {
        if (selectedFaculty === 'All') return true;
        return n.faculty === selectedFaculty || n.faculty === 'All';
    });

    /* ── Card Renderers ─────────────────────────────────────────────── */

    const renderUrgentCard = (item) => {
        const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.general;
        return (
            <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: cfg.color }]}>
                {item.isImportant && (
                    <View style={[styles.importantBanner, { backgroundColor: cfg.color }]}>
                        <Ionicons name="alert-circle" size={12} color="#FFF" />
                        <Text style={styles.importantText}>IMPORTANT</Text>
                    </View>
                )}
                {item.image ? (
                    <Image
                        source={{ uri: item.image.startsWith('http') ? item.image : `${BASE_URL.replace('/api', '')}${item.image}` }}
                        style={styles.cardImage}
                    />
                ) : null}
                <View style={styles.tagRow}>
                    <View style={[styles.typePill, { backgroundColor: cfg.color + '18' }]}>
                        <Ionicons name={cfg.icon} size={13} color={cfg.color} />
                        <Text style={[styles.typePillText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    <Text style={styles.timeText}>{getTimeAgo(item.createdAt)}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
                {item.attachment ? (
                    <View style={styles.attachmentChip}>
                        <Ionicons name="document-text" size={14} color={theme.colors.primary} />
                        <Text style={styles.attachmentText}>
                            {typeof item.attachment === 'string' && item.attachment.includes('/')
                                ? item.attachment.split('/').pop().toUpperCase()
                                : item.attachment}
                        </Text>
                    </View>
                ) : null}
                <FacultyTag faculty={item.faculty} />
            </View>
        );
    };

    const renderEventCard = (item) => (
        <View style={styles.card}>
            {item.image ? (
                <Image
                    source={{ uri: item.image.startsWith('http') ? item.image : `${BASE_URL.replace('/api', '')}${item.image}` }}
                    style={styles.cardImage}
                />
            ) : null}
            <View style={{ padding: 15 }}>
                <View style={[styles.tagRow, { justifyContent: 'space-between' }]}>
                    <View style={[styles.badge, { backgroundColor: theme.colors.secondary }]}>
                        <Text style={styles.badgeText}>EVENT</Text>
                    </View>
                    <Text style={styles.timeText}>{getTimeAgo(item.createdAt)}</Text>
                </View>
                <Text style={[styles.cardTitle, { marginTop: 10 }]}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
                <FacultyTag faculty={item.faculty} />
            </View>
        </View>
    );

    const renderGeneralCard = (item) => {
        const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.general;
        return (
            <View style={styles.card}>
                {item.isImportant && (
                    <View style={[styles.importantBanner, { backgroundColor: cfg.color }]}>
                        <Ionicons name="alert-circle" size={12} color="#FFF" />
                        <Text style={styles.importantText}>IMPORTANT</Text>
                    </View>
                )}
                {item.image ? (
                    <Image
                        source={{ uri: item.image.startsWith('http') ? item.image : `${BASE_URL.replace('/api', '')}${item.image}` }}
                        style={styles.cardImage}
                    />
                ) : null}
                <View style={[styles.tagRow, { justifyContent: 'space-between' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.iconBg, { backgroundColor: cfg.color + '18' }]}>
                            <Ionicons name={cfg.icon} size={16} color={cfg.color} />
                        </View>
                        <Text style={[styles.tagText, { color: cfg.color, marginLeft: 8 }]}>{cfg.label}</Text>
                    </View>
                    <Text style={styles.timeText}>{getTimeAgo(item.createdAt)}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
                {item.attachment ? (
                    <View style={styles.attachmentChip}>
                        <Ionicons name="document-text" size={14} color={theme.colors.primary} />
                        <Text style={styles.attachmentText}>
                            {typeof item.attachment === 'string' && item.attachment.includes('/')
                                ? item.attachment.split('/').pop().toUpperCase()
                                : item.attachment}
                        </Text>
                    </View>
                ) : null}
                <FacultyTag faculty={item.faculty} />
            </View>
        );
    };

    const renderNoticeCard = ({ item }) => {
        if (item.type === 'urgent') return renderUrgentCard(item);
        // 'event' type routed to renderGeneralCard so its image is shown the same way
        return renderGeneralCard(item);
    };

    /* ── Faculty Chip inside card ────────────────────────────────────── */
    const FacultyTag = ({ faculty }) => {
        if (!faculty || faculty === 'All') return null;
        const fac = FACULTIES.find(f => f.key === faculty);
        if (!fac) return null;
        return (
            <View style={[styles.facultyTag, { backgroundColor: fac.color + '15' }]}>
                <Ionicons name={fac.icon} size={11} color={fac.color} />
                <Text style={[styles.facultyTagText, { color: fac.color }]}>{fac.label}</Text>
            </View>
        );
    };

    /* ── Header with filter bar ──────────────────────────────────────── */
    const ListHeader = () => (
        <View style={styles.headerSection}>
            <View style={styles.titleRow}>
                <View>
                    <Text style={styles.subTitle}>OFFICIAL BULLETIN</Text>
                    <Text style={styles.mainTitle}>Campus</Text>
                    <Text style={styles.mainTitle}>Announcements</Text>
                </View>
                <View style={styles.statsBox}>
                    <Text style={styles.statsNum}>{filtered.length}</Text>
                    <Text style={styles.statsLabel}>notices</Text>
                </View>
            </View>

            {useFallback && (
                <View style={styles.offlineBanner}>
                    <Ionicons name="cloud-offline-outline" size={14} color="#F59E0B" />
                    <Text style={styles.offlineText}>Showing sample notices (offline)</Text>
                </View>
            )}

            {/* Faculty filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {FACULTIES.map(fac => {
                    const isActive = selectedFaculty === fac.key;
                    return (
                        <TouchableOpacity
                            key={fac.key}
                            style={[
                                styles.filterChip,
                                isActive && { backgroundColor: fac.color, borderColor: fac.color }
                            ]}
                            onPress={() => setSelectedFaculty(fac.key)}
                        >
                            <Ionicons
                                name={fac.icon}
                                size={14}
                                color={isActive ? '#FFF' : fac.color}
                                style={{ marginRight: 5 }}
                            />
                            <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                                {fac.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );

    const EmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={56} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>No Notices</Text>
            <Text style={styles.emptyDesc}>
                There are no notices for {selectedFaculty === 'All' ? 'any faculty' : `the ${selectedFaculty} faculty`} yet.
            </Text>
        </View>
    );

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ marginTop: 12, color: theme.colors.textSub, fontWeight: '600' }}>
                    Loading notices…
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={filtered}
                keyExtractor={item => item._id}
                contentContainerStyle={{ paddingTop: 100, paddingBottom: 130 }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={<ListHeader />}
                ListEmptyComponent={<EmptyState />}
                renderItem={renderNoticeCard}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => fetchNotices(true)}
                        colors={[theme.colors.primary]}
                        tintColor={theme.colors.primary}
                    />
                }
            />
        </View>
    );
}

/* ── Styles ─────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    headerSection: {
        padding: 20,
        paddingTop: 10,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    subTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#3b4382',
        letterSpacing: 1.2,
        marginBottom: 4,
    },
    mainTitle: {
        fontSize: 30,
        fontWeight: '900',
        color: theme.colors.textMain,
        lineHeight: 36,
    },
    statsBox: {
        alignItems: 'center',
        backgroundColor: theme.colors.primaryLight,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        marginTop: 4,
    },
    statsNum: {
        fontSize: 22,
        fontWeight: '900',
        color: theme.colors.primary,
    },
    statsLabel: {
        fontSize: 10,
        color: theme.colors.textSub,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    offlineBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 12,
    },
    offlineText: {
        fontSize: 12,
        color: '#92400E',
        marginLeft: 6,
        fontWeight: '600',
    },
    filterScroll: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 20,
        backgroundColor: theme.colors.white,
        marginRight: 10,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
    },
    filterText: {
        fontSize: 13,
        color: theme.colors.textSub,
        fontWeight: '600',
    },
    filterTextActive: {
        color: '#FFF',
        fontWeight: '700',
    },
    /* Cards */
    card: {
        backgroundColor: theme.colors.white,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: '#1E1B4B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
        padding: 18,
    },
    importantBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginBottom: 10,
        marginHorizontal: -18,
        marginTop: -18,
        paddingTop: 6,
    },
    importantText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFF',
        marginLeft: 5,
        letterSpacing: 1,
    },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    typePill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    typePillText: {
        fontSize: 11,
        fontWeight: '800',
        marginLeft: 5,
        letterSpacing: 0.5,
    },
    tagText: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.textMain,
        marginBottom: 8,
        lineHeight: 24,
    },
    cardDesc: {
        fontSize: 14,
        color: theme.colors.textSub,
        lineHeight: 21,
        marginBottom: 12,
    },
    timeText: {
        fontSize: 11,
        color: theme.colors.neutral,
        fontWeight: '600',
    },
    attachmentChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    attachmentText: {
        fontSize: 10,
        fontWeight: '900',
        color: theme.colors.primary,
        marginLeft: 5,
    },
    /* Faculty tag inside card */
    facultyTag: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 6,
    },
    facultyTagText: {
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 5,
    },
    /* Event card image */
    cardImage: {
        width: '100%',
        height: 150,
        marginTop: -18,
        marginLeft: -18,
        marginRight: -18,
        marginBottom: 0,
        width: undefined,
        alignSelf: 'stretch',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        color: theme.colors.white,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    iconBg: {
        padding: 7,
        borderRadius: 8,
    },
    /* Empty state */
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.textMain,
        marginTop: 16,
    },
    emptyDesc: {
        fontSize: 14,
        color: theme.colors.textSub,
        textAlign: 'center',
        lineHeight: 21,
        marginTop: 8,
    },
});
