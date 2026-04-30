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

/* ── Constants ──────────────────────────────────────────────────────── */
const CATEGORIES = ['All', 'Academic', 'Sports', 'Arts', 'Technology', 'Community', 'Cultural', 'Other'];

const CATEGORY_COLORS = {
    Academic: '#6366F1', Sports: '#10B981', Arts: '#EC4899',
    Technology: '#0055FE', Community: '#F59E0B', Cultural: '#8B5CF6', Other: '#6B7280',
};

const CATEGORY_ICONS = {
    Academic: 'school-outline', Sports: 'fitness-outline', Arts: 'color-palette-outline',
    Technology: 'desktop-outline', Community: 'people-outline',
    Cultural: 'globe-outline', Other: 'ellipsis-horizontal-circle-outline',
};

const ROLE_COLORS = { leader: '#F59E0B', moderator: '#6366F1', member: '#10B981' };
const ROLE_ICONS  = { leader: 'ribbon', moderator: 'shield-checkmark', member: 'person-circle' };

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];

const FALLBACK_CLUBS = [
    { _id: 'f1', name: 'IEEE Student Branch', category: 'Technology', description: 'Connecting engineering students with the global IEEE community through workshops, seminars, and competitions.', memberCount: 84, logo: '', myMembership: null, isActive: true },
    { _id: 'f2', name: 'Leo Club', category: 'Community', description: 'A service-oriented club empowering youth to volunteer and make a positive impact in the community.', memberCount: 120, logo: '', myMembership: null, isActive: true },
    { _id: 'f3', name: 'Drama Circle', category: 'Arts', description: 'Explore the world of theatre, acting, and creative storytelling with fellow drama enthusiasts.', memberCount: 45, logo: '', myMembership: null, isActive: true },
    { _id: 'f4', name: 'Badminton Club', category: 'Sports', description: 'Weekly training sessions and inter-university tournaments for badminton players of all skill levels.', memberCount: 67, logo: '', myMembership: null, isActive: true },
];

const getLogoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('file')) return url;
    return `${BASE_URL.replace('/api', '')}${url}`;
};

/* ═══════════════════════════════════════════════════════════════════
   JOIN REQUEST MODAL
════════════════════════════════════════════════════════════════════ */
function JoinRequestModal({ club, visible, onClose, onSuccess, token }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        fullName:   '',
        studentId:  '',
        faculty:    '',
        year:       '',
        whyJoin:    '',
        skills:     '',
    });

    const color   = CATEGORY_COLORS[club?.category] || '#6B7280';
    const icon    = CATEGORY_ICONS[club?.category]  || 'people-outline';
    const logoUri = getLogoUrl(club?.logo);

    const resetForm = () => setForm({ fullName: '', studentId: '', faculty: '', year: '', whyJoin: '', skills: '' });

    const handleClose = () => { resetForm(); onClose(); };

    const handleSubmit = async () => {
        if (!form.fullName.trim() || !form.studentId.trim() || !form.faculty.trim() || !form.year || !form.whyJoin.trim()) {
            Alert.alert('Incomplete Form', 'Please fill in all required fields (*).');
            return;
        }
        setIsSubmitting(true);
        try {
            await axios.post(`${BASE_URL}/clubs/${club._id}/join`, {
                applicantName:  form.fullName.trim(),
                studentId:      form.studentId.trim(),
                faculty:        form.faculty.trim(),
                year:           form.year,
                whyJoin:        form.whyJoin.trim(),
                skills:         form.skills.trim(),
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            resetForm();
            onSuccess(club._id, club.name);
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to submit request. Try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!club) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={jStyles.overlay}>
                    <View style={jStyles.sheet}>

                        {/* Drag handle + close */}
                        <View style={jStyles.topBar}>
                            <View style={jStyles.dragHandle} />
                            <TouchableOpacity style={jStyles.closeX} onPress={handleClose}>
                                <Ionicons name="close" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                            {/* Club header */}
                            <View style={jStyles.clubHeader}>
                                <View style={[jStyles.clubLogo, { backgroundColor: color + '18' }]}>
                                    {logoUri
                                        ? <Image source={{ uri: logoUri }} style={{ width: '100%', height: '100%', borderRadius: 18 }} />
                                        : <Ionicons name={icon} size={28} color={color} />
                                    }
                                </View>
                                <View style={{ flex: 1, marginLeft: 14 }}>
                                    <View style={[jStyles.catPill, { backgroundColor: color + '18' }]}>
                                        <Text style={[jStyles.catPillText, { color }]}>{club.category}</Text>
                                    </View>
                                    <Text style={jStyles.clubTitle} numberOfLines={1}>{club.name}</Text>
                                    <View style={jStyles.memberRow}>
                                        <Ionicons name="people-outline" size={12} color="#9CA3AF" />
                                        <Text style={jStyles.memberText}>{club.memberCount} members</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Info banner */}
                            <View style={[jStyles.infoBanner, { borderLeftColor: color }]}>
                                <Ionicons name="information-circle-outline" size={16} color={color} />
                                <Text style={jStyles.infoText}>
                                    Fill in this form to send a join request. The club admin will review and approve it.
                                </Text>
                            </View>

                            {/* ── Form Fields ── */}
                            <Text style={jStyles.sectionLabel}>Personal Information</Text>

                            {/* Full Name */}
                            <Text style={jStyles.label}>Full Name <Text style={jStyles.req}>*</Text></Text>
                            <TextInput
                                style={jStyles.input}
                                placeholder="Your full name"
                                placeholderTextColor="#9CA3AF"
                                value={form.fullName}
                                onChangeText={v => setForm({ ...form, fullName: v })}
                            />

                            {/* Student ID */}
                            <Text style={jStyles.label}>Student ID <Text style={jStyles.req}>*</Text></Text>
                            <TextInput
                                style={jStyles.input}
                                placeholder="e.g. SE/2021/001"
                                placeholderTextColor="#9CA3AF"
                                autoCapitalize="characters"
                                value={form.studentId}
                                onChangeText={v => setForm({ ...form, studentId: v })}
                            />

                            {/* Faculty */}
                            <Text style={jStyles.label}>Faculty / Department <Text style={jStyles.req}>*</Text></Text>
                            <TextInput
                                style={jStyles.input}
                                placeholder="e.g. Computing, Business, Engineering"
                                placeholderTextColor="#9CA3AF"
                                value={form.faculty}
                                onChangeText={v => setForm({ ...form, faculty: v })}
                            />

                            {/* Year */}
                            <Text style={jStyles.label}>Academic Year <Text style={jStyles.req}>*</Text></Text>
                            <View style={jStyles.pillRow}>
                                {YEAR_OPTIONS.map(yr => {
                                    const active = form.year === yr;
                                    return (
                                        <TouchableOpacity
                                            key={yr}
                                            style={[jStyles.yearPill, active && { backgroundColor: color, borderColor: color }]}
                                            onPress={() => setForm({ ...form, year: yr })}
                                        >
                                            <Text style={[jStyles.yearPillText, active && { color: '#FFF' }]}>{yr}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Text style={jStyles.sectionLabel}>About You</Text>

                            {/* Why Join */}
                            <Text style={jStyles.label}>Why do you want to join? <Text style={jStyles.req}>*</Text></Text>
                            <TextInput
                                style={[jStyles.input, jStyles.textArea]}
                                placeholder="Tell us your motivation for joining this club…"
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={4}
                                value={form.whyJoin}
                                onChangeText={v => setForm({ ...form, whyJoin: v })}
                            />
                            <Text style={jStyles.charCount}>{form.whyJoin.length} / 300 characters</Text>

                            {/* Skills */}
                            <Text style={jStyles.label}>Relevant Skills / Experience <Text style={jStyles.optional}>(optional)</Text></Text>
                            <TextInput
                                style={[jStyles.input, jStyles.textAreaSm]}
                                placeholder="Any skills, experience, or achievements relevant to this club…"
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={3}
                                value={form.skills}
                                onChangeText={v => setForm({ ...form, skills: v })}
                            />

                            <View style={{ height: 12 }} />
                        </ScrollView>

                        {/* Submit */}
                        <View style={jStyles.footer}>
                            <TouchableOpacity style={jStyles.cancelBtn} onPress={handleClose}>
                                <Text style={jStyles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[jStyles.submitBtn, { backgroundColor: color }, isSubmitting && { opacity: 0.7 }]}
                                onPress={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting
                                    ? <ActivityIndicator color="#FFF" size="small" />
                                    : <>
                                        <Ionicons name="paper-plane-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                                        <Text style={jStyles.submitText}>Send Request</Text>
                                      </>
                                }
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   CLUB DETAIL MODAL
════════════════════════════════════════════════════════════════════ */
function ClubDetailModal({ club, visible, onClose, onJoin, onLeave }) {
    if (!club) return null;
    const cat     = club.category;
    const color   = CATEGORY_COLORS[cat] || '#6B7280';
    const icon    = CATEGORY_ICONS[cat]  || 'ellipse-outline';
    const ms      = club.myMembership;
    const logoUri = getLogoUrl(club.logo);

    return (
        <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
            <View style={styles.modalOverlay}>
                <View style={styles.modalSheet}>
                    <LinearGradient colors={[color + '22', '#F9FAFB']} style={styles.modalGradient}>
                        <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
                            <Ionicons name="chevron-down" size={22} color="#6B7280" />
                        </TouchableOpacity>
                        <View style={[styles.modalLogo, { backgroundColor: color + '20' }]}>
                            {logoUri
                                ? <Image source={{ uri: logoUri }} style={{ width: '100%', height: '100%', borderRadius: 24 }} />
                                : <Ionicons name={icon} size={44} color={color} />
                            }
                        </View>
                        <View style={[styles.modalCatBadge, { backgroundColor: color }]}>
                            <Text style={styles.modalCatText}>{cat}</Text>
                        </View>
                        <Text style={styles.modalTitle}>{club.name}</Text>
                    </LinearGradient>

                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        <View style={styles.statsRow}>
                            <View style={styles.statBox}>
                                <Text style={styles.statNum}>{club.memberCount}</Text>
                                <Text style={styles.statLabel}>Members</Text>
                            </View>
                            <View style={[styles.statBox, styles.statBoxMid]}>
                                <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                                <Text style={[styles.statLabel, { marginTop: 4 }]}>Active</Text>
                            </View>
                            {ms?.status === 'approved' && (
                                <View style={styles.statBox}>
                                    <Ionicons name={ROLE_ICONS[ms.role] || 'person-circle'} size={22} color={ROLE_COLORS[ms.role] || '#0055FE'} />
                                    <Text style={[styles.statLabel, { marginTop: 4, textTransform: 'capitalize' }]}>{ms.role}</Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.sectionLabel}>About</Text>
                        <Text style={styles.modalDesc}>{club.description}</Text>

                        {club.members && club.members.length > 0 && (
                            <>
                                <Text style={styles.sectionLabel}>Members</Text>
                                {club.members.slice(0, 5).map(m => (
                                    <View key={m._id} style={styles.memberRow}>
                                        <View style={[styles.memberAvatar, { backgroundColor: (ROLE_COLORS[m.roleInClub] || '#6B7280') + '20' }]}>
                                            <Ionicons name={ROLE_ICONS[m.roleInClub] || 'person'} size={18} color={ROLE_COLORS[m.roleInClub] || '#6B7280'} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.memberName}>{m.user?.fullName || 'Unknown'}</Text>
                                            <Text style={styles.memberRole}>{m.roleInClub}</Text>
                                        </View>
                                    </View>
                                ))}
                            </>
                        )}
                        <View style={{ height: 30 }} />
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        {!ms && (
                            <TouchableOpacity
                                style={[styles.primaryActionBtn, { backgroundColor: color }]}
                                onPress={() => { onClose(); onJoin(club); }}
                            >
                                <Ionicons name="add-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.primaryActionText}>Request to Join</Text>
                            </TouchableOpacity>
                        )}
                        {ms?.status === 'pending' && (
                            <View style={[styles.primaryActionBtn, { backgroundColor: '#FEF3C7' }]}>
                                <Ionicons name="time-outline" size={20} color="#D97706" style={{ marginRight: 8 }} />
                                <Text style={[styles.primaryActionText, { color: '#D97706' }]}>Request Pending…</Text>
                            </View>
                        )}
                        {ms?.status === 'approved' && (
                            <TouchableOpacity
                                style={[styles.primaryActionBtn, { backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FECACA' }]}
                                onPress={() => { onLeave(club); onClose(); }}
                            >
                                <Ionicons name="exit-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
                                <Text style={[styles.primaryActionText, { color: '#EF4444' }]}>Leave Club</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   CLUB CARD
════════════════════════════════════════════════════════════════════ */
function ClubCard({ club, onPress, onJoin }) {
    const cat     = club.category;
    const color   = CATEGORY_COLORS[cat] || '#6B7280';
    const icon    = CATEGORY_ICONS[cat]  || 'ellipse-outline';
    const ms      = club.myMembership;
    const logoUri = getLogoUrl(club.logo);

    const getActionBtn = () => {
        if (!ms) {
            return (
                <TouchableOpacity
                    style={[styles.joinBtn, { backgroundColor: color }]}
                    onPress={(e) => { e.stopPropagation?.(); onJoin(club); }}
                >
                    <Ionicons name="add" size={14} color="#FFF" />
                    <Text style={styles.joinBtnText}>Join</Text>
                </TouchableOpacity>
            );
        }
        if (ms.status === 'pending') {
            return (
                <View style={[styles.statusPill, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="time-outline" size={13} color="#D97706" />
                    <Text style={[styles.statusPillText, { color: '#D97706' }]}>Pending</Text>
                </View>
            );
        }
        if (ms.status === 'approved') {
            return (
                <View style={[styles.statusPill, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name={ROLE_ICONS[ms.role] || 'checkmark-circle'} size={13} color="#059669" />
                    <Text style={[styles.statusPillText, { color: '#059669' }]}>
                        {ms.role ? ms.role.charAt(0).toUpperCase() + ms.role.slice(1) : 'Member'}
                    </Text>
                </View>
            );
        }
        return null;
    };

    return (
        <TouchableOpacity style={styles.clubCard} onPress={() => onPress(club)} activeOpacity={0.85}>
            <View style={[styles.logoContainer, { backgroundColor: color + '15' }]}>
                {logoUri
                    ? <Image source={{ uri: logoUri }} style={styles.logoImage} />
                    : <Ionicons name={icon} size={32} color={color} />
                }
            </View>
            <View style={styles.cardInfo}>
                <View style={styles.cardTopRow}>
                    <View style={[styles.catBadge, { backgroundColor: color + '15' }]}>
                        <Text style={[styles.catBadgeText, { color }]}>{cat}</Text>
                    </View>
                    {getActionBtn()}
                </View>
                <Text style={styles.clubName} numberOfLines={1}>{club.name}</Text>
                <Text style={styles.clubDesc} numberOfLines={2}>{club.description}</Text>
                <View style={styles.cardFooter}>
                    <Ionicons name="people-outline" size={13} color={theme.colors.textSub} />
                    <Text style={styles.memberCount}>{club.memberCount} members</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN SCREEN
════════════════════════════════════════════════════════════════════ */
export default function ClubsScreen() {
    const { token } = useContext(AuthContext);
    const [clubs,        setClubs]        = useState([]);
    const [isLoading,    setIsLoading]    = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const [selectedClub,   setSelectedClub]   = useState(null);
    const [detailVisible,  setDetailVisible]  = useState(false);
    const [joinVisible,    setJoinVisible]    = useState(false);
    const [joiningClub,    setJoiningClub]    = useState(null);
    const [useFallback,    setUseFallback]    = useState(false);

    const fetchClubs = useCallback(async (refresh = false) => {
        if (refresh) setIsRefreshing(true);
        else setIsLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/clubs`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 8000
            });
            setClubs(res.data.data || []);
            setUseFallback(false);
        } catch {
            setClubs(FALLBACK_CLUBS);
            setUseFallback(true);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [token]);

    useEffect(() => { fetchClubs(); }, [fetchClubs]);

    // Open the join request form
    const openJoinForm = (club) => {
        setJoiningClub(club);
        setJoinVisible(true);
    };

    const handleJoinSuccess = (clubId, clubName) => {
        setJoinVisible(false);
        setJoiningClub(null);

        // Optimistically flip the button to "Pending" immediately
        setClubs(prev => prev.map(c =>
            c._id === clubId
                ? { ...c, myMembership: { status: 'pending', role: 'member' } }
                : c
        ));

        Alert.alert(
            '✅ Request Sent!',
            `Your join request for "${clubName}" has been submitted. The club admin will review and respond shortly.`,
            [{ text: 'Got it', onPress: () => fetchClubs(true) }]
        );
    };

    const handleLeave = (club) => {
        Alert.alert(`Leave ${club.name}?`, 'You will need to re-apply to rejoin.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Leave', style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${BASE_URL}/clubs/${club._id}/leave`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        Alert.alert('Left Club', `You have left ${club.name}.`);
                        fetchClubs(true);
                    } catch (e) {
                        Alert.alert('Error', e.response?.data?.message || 'Failed to leave club');
                    }
                }
            }
        ]);
    };

    const handleCardPress = async (club) => {
        try {
            const res = await axios.get(`${BASE_URL}/clubs/${club._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedClub(res.data.data);
        } catch {
            setSelectedClub(club);
        }
        setDetailVisible(true);
    };

    const filtered = activeCategory === 'All' ? clubs : clubs.filter(c => c.category === activeCategory);
    const myClubs  = clubs.filter(c => c.myMembership?.status === 'approved');

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => fetchClubs(true)}
                        colors={[theme.colors.primary]}
                        tintColor={theme.colors.primary}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerSub}>CAMPUS LIFE</Text>
                    <Text style={styles.headerTitle}>Clubs &</Text>
                    <Text style={styles.headerTitle}>Networks</Text>
                    <Text style={styles.headerDesc}>Discover communities and be part of something bigger</Text>
                </View>

                {useFallback && (
                    <View style={styles.offlineBanner}>
                        <Ionicons name="cloud-offline-outline" size={14} color="#F59E0B" />
                        <Text style={styles.offlineText}>Showing sample clubs (offline)</Text>
                    </View>
                )}

                {/* My Clubs strip */}
                {myClubs.length > 0 && (
                    <View style={styles.myClubsSection}>
                        <Text style={styles.sectionTitle}>My Clubs</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20 }}>
                            {myClubs.map(club => {
                                const color   = CATEGORY_COLORS[club.category] || '#6B7280';
                                const icon    = CATEGORY_ICONS[club.category]  || 'ellipse-outline';
                                const logoUri = getLogoUrl(club.logo);
                                return (
                                    <TouchableOpacity key={club._id} style={styles.myClubChip} onPress={() => handleCardPress(club)}>
                                        <View style={[styles.myClubLogo, { backgroundColor: color + '20' }]}>
                                            {logoUri
                                                ? <Image source={{ uri: logoUri }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                                                : <Ionicons name={icon} size={20} color={color} />
                                            }
                                        </View>
                                        <Text style={styles.myClubName} numberOfLines={1}>{club.name}</Text>
                                        <View style={[styles.myClubRole, { backgroundColor: ROLE_COLORS[club.myMembership.role] + '20' }]}>
                                            <Text style={[styles.myClubRoleText, { color: ROLE_COLORS[club.myMembership.role] }]}>
                                                {club.myMembership.role}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* Category filter */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    {CATEGORIES.map(cat => {
                        const isActive = activeCategory === cat;
                        const col = cat === 'All' ? theme.colors.primary : CATEGORY_COLORS[cat] || '#6B7280';
                        return (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.filterChip, isActive && { backgroundColor: col, borderColor: col }]}
                                onPress={() => setActiveCategory(cat)}
                            >
                                {cat !== 'All' && (
                                    <Ionicons name={CATEGORY_ICONS[cat] || 'ellipse'} size={13} color={isActive ? '#FFF' : col} style={{ marginRight: 4 }} />
                                )}
                                <Text style={[styles.filterText, isActive && { color: '#FFF', fontWeight: '700' }]}>{cat}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* List header */}
                <View style={styles.listHeader}>
                    <Text style={styles.sectionTitle}>
                        {activeCategory === 'All' ? 'All Clubs' : `${activeCategory} Clubs`}
                    </Text>
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{filtered.length}</Text>
                    </View>
                </View>

                {/* Club list */}
                {isLoading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
                ) : filtered.length > 0 ? (
                    filtered.map(club => (
                        <ClubCard
                            key={club._id}
                            club={club}
                            onPress={handleCardPress}
                            onJoin={openJoinForm}
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={60} color="#E5E7EB" />
                        <Text style={styles.emptyTitle}>No clubs yet</Text>
                        <Text style={styles.emptyDesc}>
                            No {activeCategory !== 'All' ? activeCategory + ' ' : ''}clubs found.
                        </Text>
                    </View>
                )}

                <View style={{ height: 130 }} />
            </ScrollView>

            {/* Club Detail Modal */}
            <ClubDetailModal
                club={selectedClub}
                visible={detailVisible}
                onClose={() => setDetailVisible(false)}
                onJoin={openJoinForm}
                onLeave={handleLeave}
            />

            {/* Join Request Form Modal */}
            <JoinRequestModal
                club={joiningClub}
                visible={joinVisible}
                onClose={() => { setJoinVisible(false); setJoiningClub(null); }}
                onSuccess={handleJoinSuccess}
                token={token}
            />
        </View>
    );
}

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
