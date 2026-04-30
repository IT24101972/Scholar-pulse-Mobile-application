import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Image, ActivityIndicator, RefreshControl, Alert,
    Platform, TextInput, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { theme } from '../../../theme/theme';
import { AuthContext } from '../../../context/AuthContext';
import { BASE_URL } from '../../../config/api';

/* ── Constants ─────────────────────────────────────────────────────── */
const TYPE_CONFIG = {
    lost:  { color: '#EF4444', bg: '#FEF2F2', icon: 'alert-circle-outline',      label: 'Lost'  },
    found: { color: '#10B981', bg: '#ECFDF5', icon: 'checkmark-circle-outline',  label: 'Found' },
};

const FILTER_TABS = ['All', 'lost', 'found'];

const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const mins = Math.floor((Date.now() - new Date(dateStr)) / 60000);
    if (mins < 60)  return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};

const getFormattedDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BASE_URL.replace('/api', '')}${url}`;
};

/* ── Type Badge ────────────────────────────────────────────────────── */
function TypeBadge({ type }) {
    const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.lost;
    return (
        <View style={[badge.wrap, { backgroundColor: cfg.bg }]}>
            <View style={[badge.dot, { backgroundColor: cfg.color }]} />
            <Text style={[badge.text, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
    );
}
const badge = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    dot:  { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    text: { fontWeight: '700', fontSize: 11 },
});

/* ── Detail Modal ──────────────────────────────────────────────────── */
function ItemDetailModal({ item, visible, onClose, onDelete, isDeleting }) {
    if (!item) return null;
    const cfg      = TYPE_CONFIG[item.type] || TYPE_CONFIG.lost;
    const imageUri = getImageUrl(item.image);
    const reporter = item.reporter;

    return (
        <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
            <View style={dStyles.overlay}>
                <View style={dStyles.sheet}>
                    {/* Drag handle */}
                    <TouchableOpacity style={dStyles.handleWrap} onPress={onClose}>
                        <View style={dStyles.handle} />
                    </TouchableOpacity>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <LinearGradient colors={[cfg.bg, '#FFF']} style={dStyles.headerGrad}>
                            <View style={dStyles.headerRow}>
                                <TypeBadge type={item.type} />
                                <TouchableOpacity style={dStyles.closeBtn} onPress={onClose}>
                                    <Ionicons name="close" size={18} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                            <Text style={dStyles.title}>{item.title}</Text>
                            <View style={dStyles.metaRow}>
                                <Ionicons name="location-outline" size={13} color="#9CA3AF" />
                                <Text style={dStyles.metaText}>{item.location}</Text>
                                <Text style={dStyles.metaDot}>·</Text>
                                <Ionicons name="time-outline" size={13} color="#9CA3AF" />
                                <Text style={dStyles.metaText}>{getTimeAgo(item.createdAt)}</Text>
                            </View>
                        </LinearGradient>

                        {/* Reported by */}
                        <View style={dStyles.section}>
                            <Text style={dStyles.sectionLabel}>REPORTED BY</Text>
                            <View style={dStyles.authorCard}>
                                <View style={dStyles.authorAvatar}>
                                    <Ionicons name="person" size={22} color={theme.colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={dStyles.authorName}>{reporter?.fullName || 'Student'}</Text>
                                    <Text style={dStyles.authorSub}>{reporter?.email || ''}</Text>
                                    {item.phoneNumber && (
                                        <Text style={dStyles.authorSub}>📞 {item.phoneNumber}</Text>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Description */}
                        {item.description ? (
                            <View style={dStyles.section}>
                                <Text style={dStyles.sectionLabel}>DESCRIPTION</Text>
                                <Text style={dStyles.descText}>{item.description}</Text>
                            </View>
                        ) : null}

                        {/* Date */}
                        <View style={dStyles.section}>
                            <Text style={dStyles.sectionLabel}>DATE REPORTED</Text>
                            <Text style={dStyles.descText}>{item.date || getFormattedDate(item.createdAt)}</Text>
                        </View>

                        {/* Image */}
                        {imageUri && (
                            <View style={dStyles.section}>
                                <Text style={dStyles.sectionLabel}>ATTACHMENT</Text>
                                <Image source={{ uri: imageUri }} style={dStyles.attachImg} resizeMode="cover" />
                            </View>
                        )}

                        {/* Delete action */}
                        <View style={dStyles.section}>
                            <TouchableOpacity
                                style={dStyles.deleteBtn}
                                onPress={() => onDelete(item._id)}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator size="small" color="#EF4444" />
                                ) : (
                                    <>
                                        <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                                        <Text style={dStyles.deleteBtnText}>Remove This Listing</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const dStyles = StyleSheet.create({
    overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet:       { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '92%' },
    handleWrap:  { alignItems: 'center', paddingTop: 14, paddingBottom: 4 },
    handle:      { width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3 },
    headerGrad:  { paddingHorizontal: 24, paddingBottom: 20, paddingTop: 4 },
    headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    title:       { fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 8, lineHeight: 26 },
    metaRow:     { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    metaText:    { fontSize: 12, color: '#9CA3AF', marginLeft: 4, fontWeight: '600' },
    metaDot:     { marginHorizontal: 8, color: '#D1D5DB' },
    section:     { paddingHorizontal: 24, marginBottom: 20 },
    sectionLabel:{ fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.2, marginBottom: 10 },
    authorCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F3F4F6' },
    authorAvatar:{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    authorName:  { fontSize: 15, fontWeight: '700', color: '#111827' },
    authorSub:   { fontSize: 12, color: '#6B7280', marginTop: 2 },
    descText:    { fontSize: 14, color: '#374151', lineHeight: 22, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#F3F4F6' },
    attachImg:   { width: '100%', height: 200, borderRadius: 16 },
    deleteBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 14, borderWidth: 1.5, borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
    deleteBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
});

/* ── Item Card ─────────────────────────────────────────────────────── */
function ItemCard({ item, onPress, onDelete, isDeleting }) {
    const cfg      = TYPE_CONFIG[item.type] || TYPE_CONFIG.lost;
    const imageUri = getImageUrl(item.image);
    const reporter = item.reporter;

    return (
        <TouchableOpacity style={cStyles.card} onPress={() => onPress(item)} activeOpacity={0.85}>
            {/* Top row */}
            <View style={cStyles.topRow}>
                <Text style={cStyles.title} numberOfLines={2}>{item.title}</Text>
                <TypeBadge type={item.type} />
            </View>

            {/* Description */}
            {item.description ? (
                <Text style={cStyles.desc} numberOfLines={2}>{item.description}</Text>
            ) : null}

            {/* Thumbnail */}
            {imageUri && (
                <Image source={{ uri: imageUri }} style={cStyles.thumb} resizeMode="cover" />
            )}

            {/* Reporter info */}
            <View style={cStyles.authorRow}>
                <View style={cStyles.authorDot}>
                    <Ionicons name="person" size={12} color={theme.colors.primary} />
                </View>
                <Text style={cStyles.authorText}>{reporter?.fullName || 'Student'}</Text>
                {reporter?.email && (
                    <Text style={cStyles.authorEmail} numberOfLines={1}> · {reporter.email}</Text>
                )}
            </View>

            {/* Footer */}
            <View style={cStyles.footer}>
                <View style={cStyles.footerLeft}>
                    <Ionicons name="location-outline" size={13} color="#9CA3AF" />
                    <Text style={cStyles.footerText}>{item.location}</Text>
                    <Text style={cStyles.dotSep}>·</Text>
                    <Text style={cStyles.footerText}>{getTimeAgo(item.createdAt)}</Text>
                </View>

                {/* Quick delete */}
                <TouchableOpacity
                    style={cStyles.deleteBtn}
                    onPress={() => onDelete(item._id)}
                    disabled={isDeleting}
                >
                    <Ionicons name="trash" size={14} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const cStyles = StyleSheet.create({
    card:        { backgroundColor: '#FFF', borderRadius: 20, marginHorizontal: 20, marginBottom: 14, padding: 18, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
    topRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    title:       { flex: 1, fontSize: 15, fontWeight: '800', color: '#111827', marginRight: 10, lineHeight: 21 },
    desc:        { fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 12 },
    thumb:       { width: '100%', height: 130, borderRadius: 12, marginBottom: 12 },
    authorRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    authorDot:   { width: 22, height: 22, borderRadius: 8, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 7 },
    authorText:  { fontSize: 12, fontWeight: '700', color: '#374151' },
    authorEmail: { fontSize: 11, color: '#9CA3AF', flex: 1 },
    footer:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#F3F4F6', paddingTop: 12 },
    footerLeft:  { flexDirection: 'row', alignItems: 'center', flex: 1 },
    footerText:  { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginLeft: 4 },
    dotSep:      { marginHorizontal: 6, color: '#D1D5DB' },
    deleteBtn:   { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', justifyContent: 'center', alignItems: 'center' },
});

/* ═══════════════════════════════════════════════════════════════════
   MAIN SCREEN
════════════════════════════════════════════════════════════════════ */
export default function AdminLostFoundScreen({ navigation }) {
    const { token } = useContext(AuthContext);

    const [items,        setItems]        = useState([]);
    const [isLoading,    setIsLoading]    = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isDeleting,   setIsDeleting]   = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery,  setSearchQuery]  = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [detailVisible, setDetailVisible] = useState(false);

    const fetchItems = useCallback(async (refresh = false) => {
        if (refresh) setIsRefreshing(true);
        else         setIsLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/lostfound`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000,
            });
            setItems(res.data || []);
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to load listings');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [token]);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    /* Summary counts */
    const totalLost  = items.filter(i => i.type === 'lost').length;
    const totalFound = items.filter(i => i.type === 'found').length;

    /* Delete handler */
    const handleDelete = (itemId) => {
        Alert.alert(
            'Remove Listing',
            'Are you sure you want to permanently remove this listing? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            await axios.delete(`${BASE_URL}/lostfound/admin/${itemId}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            setItems(prev => prev.filter(i => i._id !== itemId));
                            setDetailVisible(false);
                        } catch (e) {
                            Alert.alert('Error', e.response?.data?.message || 'Failed to remove listing');
                        } finally {
                            setIsDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    /* Filtered list */
    const displayList = items.filter(item => {
        const matchType   = activeFilter === 'All' || item.type === activeFilter;
        const matchSearch = !searchQuery.trim() ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.reporter?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.reporter?.email   || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchType && matchSearch;
    });

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => fetchItems(true)}
                        colors={[theme.colors.primary]}
                        tintColor={theme.colors.primary}
                    />
                }
            >
                {/* ── Header ── */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#1E1B4B" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerSup}>ADMIN · LOST & FOUND</Text>
                        <Text style={styles.headerTitle}>Manage Listings</Text>
                    </View>
                </View>

                {/* ── Summary Cards ── */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryScroll}>
                    {[
                        { label: 'Total',   value: items.length,  color: '#6366F1', bg: '#EEF2FF', icon: 'search-outline' },
                        { label: 'Lost',    value: totalLost,     color: '#EF4444', bg: '#FEF2F2', icon: 'alert-circle-outline' },
                        { label: 'Found',   value: totalFound,    color: '#10B981', bg: '#ECFDF5', icon: 'checkmark-circle-outline' },
                    ].map(s => (
                        <View key={s.label} style={[styles.summaryCard, { backgroundColor: s.bg }]}>
                            <Ionicons name={s.icon} size={20} color={s.color} />
                            <Text style={[styles.summaryNum, { color: s.color }]}>{s.value}</Text>
                            <Text style={[styles.summaryLabel, { color: s.color }]}>{s.label}</Text>
                        </View>
                    ))}
                </ScrollView>

                {/* ── Search ── */}
                <View style={styles.searchWrapper}>
                    <Ionicons name="search-outline" size={18} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by title, location, student…"
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery !== '' && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={17} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* ── Filter Tabs ── */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    {FILTER_TABS.map(tab => {
                        const active = activeFilter === tab;
                        const cfg    = TYPE_CONFIG[tab];
                        const col    = cfg?.color || theme.colors.primary;
                        return (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.filterChip, active && { backgroundColor: col, borderColor: col }]}
                                onPress={() => setActiveFilter(tab)}
                            >
                                {cfg && <View style={[styles.filterDot, { backgroundColor: active ? '#FFF' : col }]} />}
                                <Text style={[styles.filterText, active && { color: '#FFF', fontWeight: '800' }]}>
                                    {tab === 'All' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* ── Results count ── */}
                <View style={styles.resultsRow}>
                    <Text style={styles.resultsText}>
                        {displayList.length} listing{displayList.length !== 1 ? 's' : ''}
                        {searchQuery ? ` matching "${searchQuery}"` : ''}
                    </Text>
                </View>

                {/* ── List ── */}
                {isLoading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 60 }} />
                ) : displayList.length > 0 ? (
                    displayList.map(item => (
                        <ItemCard
                            key={item._id}
                            item={item}
                            onPress={(i) => { setSelectedItem(i); setDetailVisible(true); }}
                            onDelete={handleDelete}
                            isDeleting={isDeleting}
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="search-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyTitle}>No listings found</Text>
                        <Text style={styles.emptyDesc}>
                            {searchQuery ? 'No results match your search.' : `No ${activeFilter !== 'All' ? activeFilter : ''} listings yet.`}
                        </Text>
                    </View>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* ── Detail Modal ── */}
            <ItemDetailModal
                item={selectedItem}
                visible={detailVisible}
                onClose={() => setDetailVisible(false)}
                onDelete={(id) => { setDetailVisible(false); handleDelete(id); }}
                isDeleting={isDeleting}
            />
        </View>
    );
}

/* ── Styles ─────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },

    header:    { paddingTop: Platform.OS === 'ios' ? 60 : 70, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    backBtn:   { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    headerSup: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.5 },
    headerTitle: { fontSize: 26, fontWeight: '900', color: '#1E1B4B', marginTop: 2 },

    summaryScroll: { paddingLeft: 20, marginBottom: 20 },
    summaryCard:   { alignItems: 'center', borderRadius: 18, padding: 16, marginRight: 12, width: 100 },
    summaryNum:    { fontSize: 28, fontWeight: '900', marginTop: 8 },
    summaryLabel:  { fontSize: 10, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

    searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, height: 50, marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    searchInput:   { flex: 1, marginLeft: 10, fontSize: 14, color: '#111827' },

    filterScroll:  { paddingLeft: 20, marginBottom: 16 },
    filterChip:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E5E7EB', marginRight: 10 },
    filterDot:     { width: 7, height: 7, borderRadius: 4, marginRight: 7 },
    filterText:    { fontSize: 13, fontWeight: '600', color: '#6B7280' },

    resultsRow:    { paddingHorizontal: 22, marginBottom: 14 },
    resultsText:   { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },

    emptyState:    { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
    emptyTitle:    { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 14 },
    emptyDesc:     { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 6, lineHeight: 20 },
});
