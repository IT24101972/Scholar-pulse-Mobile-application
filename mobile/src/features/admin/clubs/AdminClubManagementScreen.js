import React, { useState, useEffect, useContext } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
    Alert, ActivityIndicator, Image, Platform, KeyboardAvoidingView, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { theme } from '../../../theme/theme';
import { AuthContext } from '../../../context/AuthContext';
import { BASE_URL } from '../../../config/api';

/* ── Constants ─────────────────────────────────────────────────────── */
const CATEGORIES = ['Academic', 'Sports', 'Arts', 'Technology', 'Community', 'Cultural', 'Other'];

const CATEGORY_COLORS = {
    Academic: '#6366F1', Sports: '#10B981', Arts: '#EC4899',
    Technology: '#0055FE', Community: '#F59E0B', Cultural: '#8B5CF6', Other: '#6B7280',
};

const ROLE_COLORS  = { leader: '#F59E0B', moderator: '#6366F1', member: '#10B981' };
const STATUS_COLORS = { pending: '#F59E0B', approved: '#10B981', rejected: '#EF4444' };

const getLogoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('file')) return url;
    return `${BASE_URL.replace('/api', '')}${url}`;
};

const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};

   const AdminClubManagementScreen = ({ navigation }) => {
    const { token } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('add'); // 'add' | 'manage' | 'requests'
    const [isLoading, setIsLoading] = useState(false);
    const [clubs,     setClubs]     = useState([]);
    const [requests,  setRequests]  = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLogo, setSelectedLogo] = useState(null);

    // Request detail modal
    const [selectedRequest,   setSelectedRequest]   = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);

    // Selected club for member management
    const [selectedClub,   setSelectedClub]   = useState(null);
    const [members,        setMembers]         = useState([]);
    const [showMembersFor, setShowMembersFor]  = useState(null);

    const EMPTY_FORM = { name: '', description: '', category: 'Academic' };
    const [formData, setFormData] = useState(EMPTY_FORM);

    useEffect(() => {
        if (activeTab === 'manage') fetchClubs();
        if (activeTab === 'requests') fetchRequests();
    }, [activeTab]);

    /* ── Helpers ────────────────────────────────────────────────────── */
    const pickLogo = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission Denied', 'Camera roll access is needed.'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1,
        });
        if (!result.canceled) setSelectedLogo(result.assets[0].uri);
    };

      /* ── API ────────────────────────────────────────────────────────── */
    const fetchClubs = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/clubs/admin/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClubs(res.data.data || []);
        } catch { Alert.alert('Error', 'Could not load clubs'); }
        finally { setIsLoading(false); }
    };

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/clubs/requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data.data || []);
        } catch { Alert.alert('Error', 'Could not load requests'); }
        finally { setIsLoading(false); }
    };

    const fetchMembers = async (clubId) => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/clubs/${clubId}/members`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMembers(res.data.data || []);
        } catch { Alert.alert('Error', 'Could not load members'); }
        finally { setIsLoading(false); }
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.description.trim()) {
            Alert.alert('Error', 'Name and Description are required');
            return;
        }
        setIsLoading(true);
        try {
            const fData = new FormData();
            fData.append('name', formData.name.trim());
            fData.append('description', formData.description.trim());
            fData.append('category', formData.category);

            if (selectedLogo && selectedLogo.startsWith('file')) {
                const filename = selectedLogo.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                fData.append('logo', { uri: selectedLogo, name: filename, type: match ? `image/${match[1]}` : 'image' });
            } else if (selectedLogo) {
                fData.append('logo', selectedLogo);
            }

            const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' };

            if (isEditing) {
                await axios.put(`${BASE_URL}/clubs/${editingId}`, fData, { headers });
                Alert.alert('Success', 'Club updated!');
            } else {
                await axios.post(`${BASE_URL}/clubs`, fData, { headers });
                Alert.alert('Success', 'Club created!');
            }
            resetForm();
            setActiveTab('manage');
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to save club');
        } finally { setIsLoading(false); }
    };

    const handleDelete = (club) => {
        Alert.alert(`Delete "${club.name}"?`, 'This will remove all memberships too.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                try {
                    await axios.delete(`${BASE_URL}/clubs/${club._id}`, { headers: { Authorization: `Bearer ${token}` } });
                    setClubs(prev => prev.filter(c => c._id !== club._id));
                } catch { Alert.alert('Error', 'Failed to delete club'); }
            }}
        ]);
    };

    const handleRequestAction = async (requestId, action) => {
        try {
            await axios.put(`${BASE_URL}/clubs/requests/${requestId}`, { action }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(prev => prev.filter(r => r._id !== requestId));
            Alert.alert('Done', action === 'approve' ? 'Member approved!' : 'Request rejected.');
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to handle request');
        }
    };

    const handleRoleChange = (clubId, userId, currentRole) => {
        const roles = ['member', 'moderator', 'leader'];
        Alert.alert('Change Role', 'Select a new role:', [
            ...roles.filter(r => r !== currentRole).map(role => ({
                text: role.charAt(0).toUpperCase() + role.slice(1),
                onPress: async () => {
                    try {
                        await axios.put(`${BASE_URL}/clubs/${clubId}/members/${userId}/role`, { role }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setMembers(prev => prev.map(m => m.user?._id === userId ? { ...m, roleInClub: role } : m));
                    } catch { Alert.alert('Error', 'Failed to update role'); }
                }
            })),
            { text: 'Cancel', style: 'cancel' }
        ]);
    };

        const handleRemoveMember = (clubId, userId, memberName) => {
        Alert.alert(`Remove ${memberName}?`, 'This will remove them from the club.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: async () => {
                try {
                    await axios.delete(`${BASE_URL}/clubs/${clubId}/members/${userId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setMembers(prev => prev.filter(m => m.user?._id !== userId));
                } catch { Alert.alert('Error', 'Failed to remove member'); }
            }}
        ]);
    };

    const prepareEdit = (club) => {
        setEditingId(club._id);
        setIsEditing(true);
        setFormData({ name: club.name, description: club.description, category: club.category });
        setSelectedLogo(club.logo || null);
        setActiveTab('add');
    };

    const resetForm = () => {
        setFormData(EMPTY_FORM);
        setSelectedLogo(null);
        setIsEditing(false);
        setEditingId(null);
    };
 /* ── Tabs ───────────────────────────────────────────────────────── */
    const renderAddTab = () => (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={20}>
            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>

                <Text style={styles.inputLabel}>Club Name *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. IEEE Student Branch"
                    placeholderTextColor="#9CA3AF"
                    value={formData.name}
                    onChangeText={t => setFormData({ ...formData, name: t })}
                />

                <Text style={styles.inputLabel}>Category *</Text>
                <View style={styles.optionRow}>
                    {CATEGORIES.map(cat => {
                        const active = formData.category === cat;
                        const col = CATEGORY_COLORS[cat];
                        return (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.optionPill, active && { backgroundColor: col, borderColor: col }]}
                                onPress={() => setFormData({ ...formData, category: cat })}
                            >
                                <Text style={[styles.optionPillText, active && { color: '#FFF' }]}>{cat}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe the club's purpose, activities, and goals…"
                    placeholderTextColor="#9CA3AF"
                    multiline numberOfLines={5}
                    value={formData.description}
                    onChangeText={t => setFormData({ ...formData, description: t })}
                />
                <Text style={styles.charCount}>{formData.description.length} characters</Text>

                <Text style={styles.inputLabel}>Club Logo (optional)</Text>
                <TouchableOpacity style={styles.imagePickerBtn} onPress={pickLogo}>
                    {selectedLogo ? (
                        <View style={{ width: '100%', height: '100%' }}>
                            <Image source={{ uri: getLogoUrl(selectedLogo) }} style={styles.imagePreview} />
                            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedLogo(null)}>
                                <Ionicons name="close-circle" size={28} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                            <Text style={styles.imagePlaceholderText}>Upload Club Logo</Text>
                            <Text style={styles.imagePlaceholderSub}>Square image recommended</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={[styles.submitBtn, isLoading && { opacity: 0.7 }]} onPress={handleSave} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#FFF" /> : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name={isEditing ? 'save-outline' : 'add-circle-outline'} size={18} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.submitBtnText}>{isEditing ? 'Update Club' : 'Create Club'}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {isEditing && (
                    <TouchableOpacity style={styles.cancelEditBtn} onPress={() => { resetForm(); setActiveTab('manage'); }}>
                        <Text style={styles.cancelEditText}>Cancel Edit</Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 110 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );

    const renderManageTab = () => {
        const filtered = clubs.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.category.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Member list for a club
        if (showMembersFor) {
            return (
                <ScrollView style={styles.manageContainer} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity style={styles.backRow} onPress={() => { setShowMembersFor(null); setMembers([]); }}>
                        <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
                        <Text style={styles.backRowText}>Back to Clubs</Text>
                    </TouchableOpacity>
                    <Text style={styles.memberScreenTitle}>{showMembersFor.name}</Text>
                    <Text style={styles.memberScreenSub}>{members.length} approved members</Text>

                    {isLoading ? <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 30 }} /> :
                    members.length > 0 ? members.map(m => (
                        <View key={m._id} style={styles.memberCard}>
                            <View style={[styles.memberAvatar, { backgroundColor: ROLE_COLORS[m.roleInClub] + '20' }]}>
                                <Ionicons name="person" size={20} color={ROLE_COLORS[m.roleInClub]} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.memberName}>{m.user?.fullName || 'Unknown'}</Text>
                                <Text style={styles.memberEmail}>{m.user?.email}</Text>
                                <View style={[styles.rolePill, { backgroundColor: ROLE_COLORS[m.roleInClub] + '20' }]}>
                                    <Text style={[styles.rolePillText, { color: ROLE_COLORS[m.roleInClub] }]}>{m.roleInClub}</Text>
                                </View>
                            </View>
                            <View style={styles.memberActions}>
                                <TouchableOpacity style={styles.miniBtn} onPress={() => handleRoleChange(showMembersFor._id, m.user?._id, m.roleInClub)}>
                                    <Ionicons name="shield-outline" size={16} color="#4B5563" />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.miniBtn, { marginLeft: 8 }]} onPress={() => handleRemoveMember(showMembersFor._id, m.user?._id, m.user?.fullName)}>
                                    <Ionicons name="person-remove-outline" size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )) : (
                        <View style={styles.emptySearch}>
                            <Ionicons name="people-outline" size={48} color="#E5E7EB" />
                            <Text style={styles.emptySearchText}>No approved members yet</Text>
                        </View>
                    )}
                    <View style={{ height: 110 }} />
                </ScrollView>
            );
        }

        return (
            <ScrollView style={styles.manageContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.searchWrapper}>
                    <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search clubs…"
                        placeholderTextColor="#6B7280"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery !== '' && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>

                {isLoading ? <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} /> :
                filtered.length > 0 ? filtered.map(club => {
                    const col = CATEGORY_COLORS[club.category] || '#6B7280';
                    const logoUri = getLogoUrl(club.logo);
                    return (
                        <View key={club._id} style={styles.clubCard}>
                            <View style={[styles.clubCardLogo, { backgroundColor: col + '18' }]}>
                                {logoUri ? <Image source={{ uri: logoUri }} style={{ width: 48, height: 48, borderRadius: 14 }} />
                                    : <Ionicons name="people" size={26} color={col} />}
                            </View>
                            <View style={{ flex: 1, marginLeft: 14 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={[styles.catBadge, { backgroundColor: col + '18' }]}>
                                        <Text style={[styles.catBadgeText, { color: col }]}>{club.category}</Text>
                                    </View>
                                    <View style={styles.clubCardActions}>
                                        <TouchableOpacity style={styles.miniActionBtn} onPress={() => prepareEdit(club)}>
                                            <Ionicons name="create-outline" size={17} color="#4B5563" />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.miniActionBtn} onPress={() => { setShowMembersFor(club); fetchMembers(club._id); }}>
                                            <Ionicons name="people-outline" size={17} color={theme.colors.primary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.miniActionBtn} onPress={() => handleDelete(club)}>
                                            <Ionicons name="trash-outline" size={17} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <Text style={styles.clubCardName} numberOfLines={1}>{club.name}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                    <Ionicons name="people-outline" size={12} color="#9CA3AF" />
                                    <Text style={styles.clubCardMeta}>{club.memberCount} members</Text>
                                    <Text style={[styles.clubCardMeta, { marginLeft: 8 }]}>{getTimeAgo(club.createdAt)}</Text>
                                </View>
                            </View>
                        </View>
                    );
                }) : (
                    <View style={styles.emptySearch}>
                        <Ionicons name="search-outline" size={48} color="#E5E7EB" />
                        <Text style={styles.emptySearchText}>No clubs found</Text>
                    </View>
                )}
                <View style={{ height: 110 }} />
            </ScrollView>
        );
    };

    /* ── Request Detail Modal ───────────────────────────────────────── */
    const renderRequestDetailModal = () => {
        if (!selectedRequest) return null;
        const req = selectedRequest;
        const col = CATEGORY_COLORS[req.club?.category] || '#6B7280';

        const InfoRow = ({ icon, label, value }) => {
            if (!value) return null;
            return (
                <View style={styles.infoRow}>
                    <View style={styles.infoIconWrap}>
                        <Ionicons name={icon} size={15} color={col} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.infoLabel}>{label}</Text>
                        <Text style={styles.infoValue}>{value}</Text>
                    </View>
                </View>
            );
        };

        return (
            <Modal
                visible={detailModalVisible}
                animationType="slide"
                transparent
                presentationStyle="overFullScreen"
                onRequestClose={() => setDetailModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setDetailModalVisible(false)}
                >
                    <TouchableOpacity activeOpacity={1} style={styles.modalSheet}>
                        {/* Handle & Close */}
                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 14, paddingBottom: 10 }}>
                            <View style={[styles.modalHandle, { marginTop: 0, marginBottom: 0 }]} />
                            <TouchableOpacity
                                style={{ position: 'absolute', right: 20, top: 15 }}
                                onPress={() => setDetailModalVisible(false)}
                            >
                                <Ionicons name="close-circle" size={26} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Club badge + time */}
                            <View style={styles.modalTopRow}>
                                <View style={[styles.reqClubBadge, { backgroundColor: col + '18' }]}>
                                    <Ionicons name="people" size={13} color={col} />
                                    <Text style={[styles.reqClubText, { color: col }]} numberOfLines={1}>
                                        {req.club?.name}
                                    </Text>
                                </View>
                                <Text style={styles.timeAgoText}>{getTimeAgo(req.createdAt)}</Text>
                            </View>

                            {/* Applicant identity */}
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>APPLICANT</Text>
                                <View style={styles.applicantCard}>
                                    <View style={styles.applicantAvatar}>
                                        <Ionicons name="person" size={24} color={theme.colors.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.applicantName}>
                                            {req.applicantName || req.user?.fullName || 'Unknown'}
                                        </Text>
                                        <Text style={styles.applicantEmail}>{req.user?.email}</Text>
                                        {req.user?.studentId && (
                                            <Text style={styles.applicantId}>ID: {req.user.studentId}</Text>
                                        )}
                                    </View>
                                </View>
                            </View>

                            {/* Form details */}
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>APPLICATION DETAILS</Text>
                                <View style={styles.detailsCard}>
                                    <InfoRow icon="school-outline"  label="Faculty / Department" value={req.applicantFaculty} />
                                    <InfoRow icon="calendar-outline" label="Academic Year"        value={req.applicantYear} />
                                </View>
                            </View>

                            {req.whyJoin ? (
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>WHY DO THEY WANT TO JOIN?</Text>
                                    <View style={styles.textBlock}>
                                        <Text style={styles.textBlockContent}>{req.whyJoin}</Text>
                                    </View>
                                </View>
                            ) : null}

                            {req.skills ? (
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>SKILLS / EXPERIENCE</Text>
                                    <View style={styles.textBlock}>
                                        <Text style={styles.textBlockContent}>{req.skills}</Text>
                                    </View>
                                </View>
                            ) : null}

                            <View style={{ height: 16 }} />
                        </ScrollView>

                        {/* Action buttons */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.rejectBtnFull}
                                onPress={() => {
                                    setDetailModalVisible(false);
                                    setTimeout(() => handleRequestAction(req._id, 'reject'), 300);
                                }}
                            >
                                <Ionicons name="close" size={17} color="#EF4444" />
                                <Text style={styles.rejectBtnText}>Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.approveBtnFull}
                                onPress={() => {
                                    setDetailModalVisible(false);
                                    setTimeout(() => handleRequestAction(req._id, 'approve'), 300);
                                }}
                            >
                                <Ionicons name="checkmark" size={17} color="#FFF" />
                                <Text style={styles.approveBtnText}>Approve</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        );
    };

    const renderRequestsTab = () => (
        <ScrollView style={styles.manageContainer} showsVerticalScrollIndicator={false}>
            {isLoading ? <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} /> :
            requests.length > 0 ? requests.map(req => {
                const col = CATEGORY_COLORS[req.club?.category] || '#6B7280';
                return (
                    <TouchableOpacity
                        key={req._id}
                        style={styles.requestCard}
                        onPress={() => { setSelectedRequest(req); setDetailModalVisible(true); }}
                        activeOpacity={0.85}
                    >
                        <View style={styles.requestTop}>
                            <View style={[styles.reqClubBadge, { backgroundColor: col + '18' }]}>
                                <Ionicons name="people" size={13} color={col} />
                                <Text style={[styles.reqClubText, { color: col }]} numberOfLines={1}>{req.club?.name}</Text>
                            </View>
                            <Text style={styles.timeAgoText}>{getTimeAgo(req.createdAt)}</Text>
                        </View>

                        <View style={styles.requestUser}>
                            <View style={styles.userAvatar}>
                                <Ionicons name="person" size={20} color={theme.colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.reqUserName}>
                                    {req.applicantName || req.user?.fullName || 'Unknown'}
                                </Text>
                                <Text style={styles.reqUserEmail}>{req.user?.email}</Text>
                                {req.user?.studentId && <Text style={styles.reqStudentId}>ID: {req.user.studentId}</Text>}
                                {req.applicantFaculty ? (
                                    <Text style={styles.reqMeta}>
                                        <Ionicons name="school-outline" size={11} color="#9CA3AF" /> {req.applicantFaculty}
                                        {req.applicantYear ? `  ·  ${req.applicantYear}` : ''}
                                    </Text>
                                ) : null}
                            </View>
                        </View>

                        {/* Tap hint + quick actions */}
                        <View style={styles.requestCardFooter}>
                            <View style={styles.viewDetailHint}>
                                <Ionicons name="eye-outline" size={13} color={col} />
                                <Text style={[styles.viewDetailText, { color: col }]}>Tap to view full application</Text>
                            </View>
                            <View style={styles.quickActions}>
                                <TouchableOpacity
                                    style={styles.quickRejectBtn}
                                    onPress={() => handleRequestAction(req._id, 'reject')}
                                >
                                    <Ionicons name="close" size={15} color="#EF4444" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.quickApproveBtn}
                                    onPress={() => handleRequestAction(req._id, 'approve')}
                                >
                                    <Ionicons name="checkmark" size={15} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                );
            }) : (
                <View style={styles.emptySearch}>
                    <Ionicons name="checkmark-circle-outline" size={56} color="#D1FAE5" />
                    <Text style={[styles.emptySearchText, { color: '#059669' }]}>All caught up!</Text>
                    <Text style={{ color: '#9CA3AF', marginTop: 6, fontSize: 13 }}>No pending join requests</Text>
                </View>
            )}
            <View style={{ height: 110 }} />
        </ScrollView>
    );

    /* ── Root ───────────────────────────────────────────────────────── */
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1E1B4B" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Club Management</Text>
                    <Text style={styles.headerSub}>{clubs.length} clubs active</Text>
                </View>
            </View>

            {/* 3-way Toggle */}
            <View style={styles.toggleWrapper}>
                <View style={styles.toggleBackground}>
                    {[
                        { key: 'add',      label: isEditing ? 'Edit Club' : 'Add Club', icon: isEditing ? 'create-outline' : 'add-circle-outline' },
                        { key: 'manage',   label: 'Manage',   icon: 'list-outline' },
                        { key: 'requests', label: `Requests${requests.length > 0 ? ` (${requests.length})` : ''}`, icon: 'people-outline' },
                    ].map(tab => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.toggleOption, activeTab === tab.key && styles.toggleOptionActive]}
                            onPress={() => {
                                if (tab.key === 'add' && !isEditing) resetForm();
                                setActiveTab(tab.key);
                            }}
                        >
                            <Ionicons name={tab.icon} size={14} color={activeTab === tab.key ? theme.colors.primary : '#6B7280'} style={{ marginRight: 4 }} />
                            <Text style={[styles.toggleText, activeTab === tab.key && styles.toggleTextActive]} numberOfLines={1}>{tab.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {activeTab === 'add'      && renderAddTab()}
            {activeTab === 'manage'   && renderManageTab()}
            {activeTab === 'requests' && renderRequestsTab()}
            {renderRequestDetailModal()}
        </View>
    );
};