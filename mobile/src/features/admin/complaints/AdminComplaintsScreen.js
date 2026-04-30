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
const STATUS_CONFIG = {
    Pending:    { color: '#F59E0B', bg: '#FFFBEB', icon: 'time-outline',             label: 'Pending'     },
    InProgress: { color: '#3B82F6', bg: '#EFF6FF', icon: 'reload-circle-outline',    label: 'In Progress' },
    Resolved:   { color: '#10B981', bg: '#ECFDF5', icon: 'checkmark-circle-outline', label: 'Resolved'    },
};

const FILTER_TABS = ['All', 'Pending', 'InProgress', 'Resolved'];

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

const getLogoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BASE_URL.replace('/api', '')}${url}`;
};

/* ── Status Badge ──────────────────────────────────────────────────── */
function StatusBadge({ status, size = 'sm' }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
    return (
        <View style={[sBadge.wrap, { backgroundColor: cfg.bg }]}>
            <View style={[sBadge.dot, { backgroundColor: cfg.color }]} />
            <Text style={[sBadge.text, { color: cfg.color, fontSize: size === 'lg' ? 13 : 11 }]}>{cfg.label}</Text>
        </View>
    );
}
const sBadge = StyleSheet.create({
    wrap:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    dot:   { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    text:  { fontWeight: '700' },
});

/* ── Detail Modal ──────────────────────────────────────────────────── */
function ComplaintDetailModal({ report, visible, onClose, onStatusUpdate, onDelete, isUpdating }) {
    if (!report) return null;
    const cfg     = STATUS_CONFIG[report.status] || STATUS_CONFIG.Pending;
    const imageUri = getLogoUrl(report.image);
    const author   = report.author;

    const NEXT_STATUSES = {
        Pending:    ['InProgress', 'Resolved'],
        InProgress: ['Resolved', 'Pending'],
        Resolved:   ['Pending', 'InProgress'],
    };

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
                                <StatusBadge status={report.status} size="lg" />
                                <TouchableOpacity style={dStyles.closeBtn} onPress={onClose}>
                                    <Ionicons name="close" size={18} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                            <Text style={dStyles.title}>{report.title}</Text>
                            <View style={dStyles.metaRow}>
                                <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
                                <Text style={dStyles.metaText}>{getFormattedDate(report.createdAt)}</Text>
                                <Text style={dStyles.metaDot}>·</Text>
                                <Ionicons name="time-outline" size={13} color="#9CA3AF" />
                                <Text style={dStyles.metaText}>{getTimeAgo(report.createdAt)}</Text>
                            </View>
                        </LinearGradient>

                        {/* Submitted by */}
                        <View style={dStyles.section}>
                            <Text style={dStyles.sectionLabel}>SUBMITTED BY</Text>
                            <View style={dStyles.authorCard}>
                                <View style={dStyles.authorAvatar}>
                                    <Ionicons name="person" size={22} color={theme.colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={dStyles.authorName}>{author?.fullName || report.authorEmail?.split('@')[0] || 'Student'}</Text>
                                    <Text style={dStyles.authorSub}>{report.authorEmail}</Text>
                                    {report.studentId && <Text style={dStyles.studentId}>ID: {report.studentId}</Text>}
                                </View>
                            </View>
                        </View>

                        {/* Description */}
                        <View style={dStyles.section}>
                            <Text style={dStyles.sectionLabel}>DESCRIPTION</Text>
                            <Text style={dStyles.descText}>{report.description}</Text>
                        </View>

                        {/* Image */}
                        {imageUri && (
                            <View style={dStyles.section}>
                                <Text style={dStyles.sectionLabel}>ATTACHMENT</Text>
                                <Image source={{ uri: imageUri }} style={dStyles.attachImg} resizeMode="cover" />
                            </View>
                        )}

                        {/* Update Status */}
                        <View style={dStyles.section}>
                            <Text style={dStyles.sectionLabel}>UPDATE STATUS</Text>
                            <View style={dStyles.statusBtnRow}>
                                {(NEXT_STATUSES[report.status] || []).map(s => {
                                    const c = STATUS_CONFIG[s];
                                    return (
                                        <TouchableOpacity
                                            key={s}
                                            style={[dStyles.statusActionBtn, { backgroundColor: c.bg, borderColor: c.color }]}
                                            onPress={() => { onStatusUpdate(report._id, s); onClose(); }}
                                            disabled={isUpdating}
                                        >
                                            <Ionicons name={c.icon} size={16} color={c.color} style={{ marginRight: 6 }} />
                                            <Text style={[dStyles.statusActionText, { color: c.color }]}>
                                                Mark as {c.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const dStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '92%' },
    handleWrap: { alignItems: 'center', paddingTop: 14, paddingBottom: 4 },
    handle: { width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3 },
    headerGrad: { paddingHorizontal: 24, paddingBottom: 20, paddingTop: 4 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 8, lineHeight: 26 },
    metaRow: { flexDirection: 'row', alignItems: 'center' },
    metaText: { fontSize: 12, color: '#9CA3AF', marginLeft: 4, fontWeight: '600' },
    metaDot: { marginHorizontal: 8, color: '#D1D5DB' },
    section: { paddingHorizontal: 24, marginBottom: 20 },
    sectionLabel: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.2, marginBottom: 10 },
    authorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F3F4F6' },
    authorAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    authorName: { fontSize: 15, fontWeight: '700', color: '#111827' },
    authorSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    studentId: { fontSize: 11, color: '#9CA3AF', marginTop: 2, fontWeight: '600' },
    descText: { fontSize: 14, color: '#374151', lineHeight: 22, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#F3F4F6' },
    attachImg: { width: '100%', height: 200, borderRadius: 16 },
    statusBtnRow: { gap: 10 },
    statusActionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
    statusActionText: { fontWeight: '700', fontSize: 14 },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 14, borderWidth: 1.5, borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
    deleteBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
});

/* ── Complaint Card ────────────────────────────────────────────────── */
function ComplaintCard({ report, onPress, onStatusUpdate, isUpdating }) {
    const cfg      = STATUS_CONFIG[report.status] || STATUS_CONFIG.Pending;
    const author   = report.author;
    const imageUri = getLogoUrl(report.image);

    const QUICK_ADVANCE = { Pending: 'InProgress', InProgress: 'Resolved' };
    const nextStatus = QUICK_ADVANCE[report.status];

    return (
        <TouchableOpacity style={cStyles.card} onPress={() => onPress(report)} activeOpacity={0.85}>
            {/* Top row: title + status badge */}
            <View style={cStyles.topRow}>
                <Text style={cStyles.title} numberOfLines={2}>{report.title}</Text>
                <StatusBadge status={report.status} />
            </View>

            {/* Description */}
            <Text style={cStyles.desc} numberOfLines={3}>{report.description}</Text>

            {/* Attachment thumb */}
            {imageUri && (
                <Image source={{ uri: imageUri }} style={cStyles.thumb} resizeMode="cover" />
            )}

            {/* Author row */}
            <View style={cStyles.authorRow}>
                <View style={cStyles.authorDot}>
                    <Ionicons name="person" size={12} color={theme.colors.primary} />
                </View>
                <Text style={cStyles.authorText}>
                    {author?.fullName || report.authorEmail?.split('@')[0] || 'Student'}
                </Text>
                {report.studentId && (
                    <Text style={cStyles.studentIdText}>· {report.studentId}</Text>
                )}
            </View>

            {/* Footer: date + quick action */}
            <View style={cStyles.footer}>
                <View style={cStyles.dateGroup}>
                    <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
                    <Text style={cStyles.dateText}>{getFormattedDate(report.createdAt)}</Text>
                    <Text style={cStyles.dotSep}>·</Text>
                    <Text style={cStyles.dateText}>{getTimeAgo(report.createdAt)}</Text>
                </View>

                {/* Quick advance button if not resolved */}
                {nextStatus && (
                    <TouchableOpacity
                        style={[cStyles.quickBtn, { backgroundColor: STATUS_CONFIG[nextStatus].bg, borderColor: STATUS_CONFIG[nextStatus].color }]}
                        onPress={() => onStatusUpdate(report._id, nextStatus)}
                        disabled={isUpdating}
                    >
                        {isUpdating
                            ? <ActivityIndicator size="small" color={STATUS_CONFIG[nextStatus].color} />
                            : <>
                                <Ionicons name={STATUS_CONFIG[nextStatus].icon} size={13} color={STATUS_CONFIG[nextStatus].color} />
                                <Text style={[cStyles.quickBtnText, { color: STATUS_CONFIG[nextStatus].color }]}>
                                    {STATUS_CONFIG[nextStatus].label}
                                </Text>
                              </>
                        }
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
}

const cStyles = StyleSheet.create({
    card: { backgroundColor: '#FFF', borderRadius: 20, marginHorizontal: 20, marginBottom: 14, padding: 18, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    title: { flex: 1, fontSize: 15, fontWeight: '800', color: '#111827', marginRight: 10, lineHeight: 21 },
    desc: { fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 12 },
    thumb: { width: '100%', height: 140, borderRadius: 12, marginBottom: 12 },
    authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    authorDot: { width: 22, height: 22, borderRadius: 8, backgroundColor: theme.colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 7 },
    authorText: { fontSize: 12, fontWeight: '700', color: '#374151' },
    studentIdText: { fontSize: 12, color: '#9CA3AF', marginLeft: 5 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#F3F4F6', paddingTop: 12 },
    dateGroup: { flexDirection: 'row', alignItems: 'center' },
    dateText: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginLeft: 4 },
    dotSep: { marginHorizontal: 6, color: '#D1D5DB' },
    quickBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, gap: 5 },
    quickBtnText: { fontSize: 11, fontWeight: '700' },
});

/* ═══════════════════════════════════════════════════════════════════
   MAIN SCREEN
════════════════════════════════════════════════════════════════════ */
export default function AdminComplaintsScreen({ navigation }) {
    const { token } = useContext(AuthContext);

    const [reports,      setReports]      = useState([]);
    const [summary,      setSummary]      = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
    const [isLoading,    setIsLoading]    = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isUpdating,   setIsUpdating]   = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery,  setSearchQuery]  = useState('');
    const [selectedReport, setSelectedReport] = useState(null);
    const [detailVisible,  setDetailVisible]  = useState(false);

    const fetchReports = useCallback(async (refresh = false) => {
        if (refresh) setIsRefreshing(true);
        else setIsLoading(true);
        try {
            const params = activeFilter !== 'All' ? `?status=${activeFilter}` : '';
            const res = await axios.get(`${BASE_URL}/reports/admin/all${params}`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000,
            });
            setReports(res.data.data || []);
            if (res.data.summary) setSummary(res.data.summary);
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to load complaints');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [token, activeFilter]);

    useEffect(() => { fetchReports(); }, [fetchReports]);

    /* Status update */
    const handleStatusUpdate = async (reportId, newStatus) => {
        setIsUpdating(true);
        try {
            const res = await axios.patch(
                `${BASE_URL}/reports/admin/${reportId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Optimistic local update
            setReports(prev => prev.map(r => r._id === reportId ? { ...r, status: newStatus } : r));
            // Update summary counts
            setSummary(prev => {
                const oldStatus = reports.find(r => r._id === reportId)?.status;
                const updated = { ...prev };
                if (oldStatus === 'Pending')    updated.pending    = Math.max(0, updated.pending - 1);
                if (oldStatus === 'InProgress') updated.inProgress = Math.max(0, updated.inProgress - 1);
                if (oldStatus === 'Resolved')   updated.resolved   = Math.max(0, updated.resolved - 1);
                if (newStatus === 'Pending')    updated.pending    += 1;
                if (newStatus === 'InProgress') updated.inProgress += 1;
                if (newStatus === 'Resolved')   updated.resolved   += 1;
                return updated;
            });
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to update status');
        } finally {
            setIsUpdating(false);
        }
    };

    /* Delete logic removed as per requirements */

    /* Filtered + searched list */
    const displayList = reports.filter(r => {
        const matchSearch = !searchQuery.trim() ||
            r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.authorEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.studentId || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchSearch;
    });

    /* ── Render ───────────────────────────────────────────────────── */
    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => fetchReports(true)}
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
                        <Text style={styles.headerSup}>ADMIN · COMPLAINTS</Text>
                        <Text style={styles.headerTitle}>Issue Tracker</Text>
                    </View>
                </View>

                {/* ── Summary Cards ── */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryScroll}>
                    {[
                        { label: 'Total',       value: summary.total,      color: '#6366F1', bg: '#EEF2FF', icon: 'document-text-outline' },
                        { label: 'Pending',     value: summary.pending,    color: '#F59E0B', bg: '#FFFBEB', icon: 'time-outline' },
                        { label: 'In Progress', value: summary.inProgress, color: '#3B82F6', bg: '#EFF6FF', icon: 'reload-circle-outline' },
                        { label: 'Resolved',    value: summary.resolved,   color: '#10B981', bg: '#ECFDF5', icon: 'checkmark-circle-outline' },
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
                        placeholder="Search by title, student, ID…"
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
                        const cfg    = STATUS_CONFIG[tab];
                        const col    = cfg?.color || theme.colors.primary;
                        return (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.filterChip, active && { backgroundColor: col, borderColor: col }]}
                                onPress={() => setActiveFilter(tab)}
                            >
                                {cfg && <View style={[styles.filterDot, { backgroundColor: active ? '#FFF' : col }]} />}
                                <Text style={[styles.filterText, active && { color: '#FFF', fontWeight: '800' }]}>
                                    {tab === 'InProgress' ? 'In Progress' : tab}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* ── Results count ── */}
                <View style={styles.resultsRow}>
                    <Text style={styles.resultsText}>
                        {displayList.length} complaint{displayList.length !== 1 ? 's' : ''}
                        {searchQuery ? ` matching "${searchQuery}"` : ''}
                    </Text>
                </View>

                {/* ── List ── */}
                {isLoading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 60 }} />
                ) : displayList.length > 0 ? (
                    displayList.map(r => (
                        <ComplaintCard
                            key={r._id}
                            report={r}
                            onPress={(rep) => { setSelectedReport(rep); setDetailVisible(true); }}
                            onStatusUpdate={handleStatusUpdate}
                            isUpdating={isUpdating}
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="checkmark-done-circle-outline" size={64} color="#D1FAE5" />
                        <Text style={styles.emptyTitle}>All clear!</Text>
                        <Text style={styles.emptyDesc}>
                            {searchQuery ? 'No results found for your search.' : `No ${activeFilter !== 'All' ? activeFilter : ''} complaints.`}
                        </Text>
                    </View>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* ── Detail Modal ── */}
            <ComplaintDetailModal
                report={selectedReport}
                visible={detailVisible}
                onClose={() => setDetailVisible(false)}
                onStatusUpdate={(id, s) => { setDetailVisible(false); handleStatusUpdate(id, s); }}
                isUpdating={isUpdating}
            />
        </View>
    );
}

/* ── Styles ─────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },

    header: { paddingTop: Platform.OS === 'ios' ? 60 : 70, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    headerSup: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.5 },
    headerTitle: { fontSize: 26, fontWeight: '900', color: '#1E1B4B', marginTop: 2 },

    summaryScroll: { paddingLeft: 20, marginBottom: 20 },
    summaryCard: { alignItems: 'center', borderRadius: 18, padding: 16, marginRight: 12, width: 100 },
    summaryNum: { fontSize: 28, fontWeight: '900', marginTop: 8 },
    summaryLabel: { fontSize: 10, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

    searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, height: 50, marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#111827' },

    filterScroll: { paddingLeft: 20, marginBottom: 16 },
    filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E5E7EB', marginRight: 10 },
    filterDot: { width: 7, height: 7, borderRadius: 4, marginRight: 7 },
    filterText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },

    resultsRow: { paddingHorizontal: 22, marginBottom: 14 },
    resultsText: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },

    emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 14 },
    emptyDesc: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 6, lineHeight: 20 },
});
