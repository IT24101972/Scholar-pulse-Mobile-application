import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Image, ActivityIndicator, RefreshControl, Alert, Modal,
    Platform, TextInput, KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { theme } from '../../theme/theme';
import { AuthContext } from '../../context/AuthContext';
import { BASE_URL } from '../../config/api';


/* ═══════════════════════════════════════════════════════════════════
   STYLES
════════════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },

    header: { paddingTop: Platform.OS === 'ios' ? 100 : 120, paddingHorizontal: 24, marginBottom: 16 },
    headerSub:  { fontSize: 11, fontWeight: '800', color: '#3b4382', letterSpacing: 1.5, marginBottom: 4 },
    headerTitle:{ fontSize: 30, fontWeight: '900', color: theme.colors.textMain, lineHeight: 36 },
    headerDesc: { fontSize: 13, color: theme.colors.textSub, marginTop: 8, lineHeight: 19 },

    offlineBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 24, borderRadius: 10, marginBottom: 12 },
    offlineText: { fontSize: 12, color: '#92400E', marginLeft: 6, fontWeight: '600' },

    myClubsSection: { marginBottom: 20 },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.textMain, paddingHorizontal: 24, marginBottom: 12 },
    myClubChip: { alignItems: 'center', marginRight: 16, width: 80 },
    myClubLogo: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    myClubName: { fontSize: 11, fontWeight: '700', color: theme.colors.textMain, textAlign: 'center' },
    myClubRole: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
    myClubRoleText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

    filterScroll: { paddingLeft: 24, marginBottom: 20 },
    filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: theme.colors.border, marginRight: 10 },
    filterText: { fontSize: 13, fontWeight: '600', color: theme.colors.textSub },

    listHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 },
    countBadge: { marginLeft: 8, backgroundColor: theme.colors.primaryLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
    countText: { fontSize: 12, fontWeight: '800', color: theme.colors.primary },

    clubCard: { backgroundColor: '#FFF', borderRadius: 20, marginHorizontal: 24, marginBottom: 16, flexDirection: 'row', padding: 16, borderWidth: 1, borderColor: theme.colors.border, shadowColor: '#1E1B4B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
    logoContainer: { width: 64, height: 64, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    logoImage: { width: 64, height: 64, borderRadius: 18 },
    cardInfo: { flex: 1 },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    catBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    catBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
    clubName: { fontSize: 16, fontWeight: '800', color: theme.colors.textMain, marginBottom: 4 },
    clubDesc: { fontSize: 12, color: theme.colors.textSub, lineHeight: 17, marginBottom: 8 },
    cardFooter: { flexDirection: 'row', alignItems: 'center' },
    memberCount: { fontSize: 12, color: theme.colors.textSub, marginLeft: 4, fontWeight: '600' },

    joinBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, gap: 4 },
    joinBtnText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
    statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4 },
    statusPillText: { fontSize: 11, fontWeight: '700' },

    // Detail Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#F9FAFB', borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '90%', overflow: 'hidden' },
    modalGradient: { paddingTop: 16, paddingBottom: 24, alignItems: 'center', paddingHorizontal: 24 },
    modalCloseBtn: { alignSelf: 'center', width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, marginBottom: 20 },
    modalLogo: { width: 90, height: 90, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    modalCatBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 10 },
    modalCatText: { fontSize: 11, fontWeight: '800', color: '#FFF', textTransform: 'uppercase', letterSpacing: 1 },
    modalTitle: { fontSize: 24, fontWeight: '900', color: '#1E1B4B', textAlign: 'center' },
    modalBody: { paddingHorizontal: 24 },
    statsRow: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginTop: 20, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.border },
    statBox: { flex: 1, alignItems: 'center' },
    statBoxMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E5E7EB' },
    statNum: { fontSize: 22, fontWeight: '900', color: theme.colors.primary },
    statLabel: { fontSize: 11, color: theme.colors.textSub, fontWeight: '600', textTransform: 'uppercase' },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: '#4B5563', marginBottom: 8 },
    modalDesc: { fontSize: 14, color: theme.colors.textSub, lineHeight: 22, marginBottom: 20 },
    memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#F3F4F6' },
    memberAvatar: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    memberName: { fontSize: 14, fontWeight: '700', color: '#111827' },
    memberRole: { fontSize: 11, color: '#9CA3AF', textTransform: 'capitalize', fontWeight: '600' },
    modalFooter: { paddingHorizontal: 24, paddingBottom: 36, paddingTop: 16, backgroundColor: '#F9FAFB' },
    primaryActionBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderRadius: 16, paddingVertical: 16 },
    primaryActionText: { fontSize: 16, fontWeight: '800', color: '#FFF' },

    emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.textMain, marginTop: 16 },
    emptyDesc: { fontSize: 14, color: theme.colors.textSub, textAlign: 'center', marginTop: 8, lineHeight: 21 },
});

/* Join Request Modal Styles */
const jStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30,
        maxHeight: '94%', paddingBottom: 0, overflow: 'hidden',
    },
    topBar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 14, paddingHorizontal: 20, marginBottom: 4 },
    dragHandle: { width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3 },
    closeX: { position: 'absolute', right: 20, width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },

    clubHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderColor: '#F3F4F6' },
    clubLogo: { width: 54, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    catPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 4 },
    catPillText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    clubTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
    memberRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
    memberText: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginLeft: 4 },

    infoBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F0F9FF', padding: 12, marginHorizontal: 20, marginVertical: 14, borderRadius: 12, borderLeftWidth: 4 },
    infoText: { flex: 1, fontSize: 12, color: '#374151', marginLeft: 8, lineHeight: 17, fontWeight: '500' },

    sectionLabel: { fontSize: 12, fontWeight: '800', color: '#6B7280', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 20, marginTop: 18, marginBottom: 10 },
    label: { fontSize: 13, fontWeight: '700', color: '#374151', paddingHorizontal: 20, marginBottom: 7 },
    req: { color: '#EF4444' },
    optional: { fontSize: 11, fontWeight: '500', color: '#9CA3AF' },

    input: { backgroundColor: '#F9FAFB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: '#111827', borderWidth: 1.5, borderColor: '#E5E7EB', marginHorizontal: 20 },
    textArea: { height: 110, textAlignVertical: 'top', paddingTop: 14 },
    textAreaSm: { height: 80, textAlignVertical: 'top', paddingTop: 14 },
    charCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginRight: 20, marginTop: 4, fontWeight: '600' },

    pillRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 8, marginBottom: 4 },
    yearPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB' },
    yearPillText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },

    footer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderColor: '#F3F4F6', gap: 12, backgroundColor: '#FFF' },
    cancelBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 15, borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E7EB' },
    cancelText: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
    submitBtn: { flex: 2, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 15, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    submitText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
});