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

/* ── Component ─────────────────────────────────────────────────────── */
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

/* ── Styles ─────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },

    header: { paddingTop: 60, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backBtn: { padding: 4, marginRight: 14 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E1B4B' },
    headerSub:   { fontSize: 12, color: '#6B7280', fontWeight: '500', marginTop: 2 },

    /* 3-way toggle */
    toggleWrapper: { paddingHorizontal: 20, marginBottom: 24 },
    toggleBackground: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 16, padding: 4 },
    toggleOption: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 11, borderRadius: 12 },
    toggleOptionActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
    toggleText:       { fontSize: 12, fontWeight: '600', color: '#6B7280' },
    toggleTextActive: { color: theme.colors.primary, fontWeight: '700' },

    /* Form */
    formContainer: { paddingHorizontal: 24 },
    inputLabel: { fontSize: 13, fontWeight: '700', color: '#4B5563', marginBottom: 8, marginTop: 18 },
    input: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, fontSize: 15, color: '#1E1B4B', borderWidth: 1, borderColor: '#E5E7EB' },
    textArea: { height: 120, textAlignVertical: 'top' },
    charCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4, fontWeight: '600' },

    optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    optionPill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E5E7EB' },
    optionPillText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },

    imagePickerBtn: { backgroundColor: '#FFF', height: 160, borderRadius: 16, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    imagePreview: { width: '100%', height: '100%' },
    imagePlaceholder: { alignItems: 'center' },
    imagePlaceholderText: { color: '#9CA3AF', marginTop: 8, fontWeight: '600' },
    imagePlaceholderSub: { color: '#D1D5DB', fontSize: 11, marginTop: 3 },
    removeImageBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 14, elevation: 5 },

    submitBtn: { backgroundColor: theme.colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 28, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    cancelEditBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 10, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB' },
    cancelEditText: { color: '#6B7280', fontWeight: '700', fontSize: 14 },

    /* Manage */
    manageContainer: { paddingHorizontal: 20 },
    searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, height: 50, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1F2937' },

    clubCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 14, marginBottom: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    clubCardLogo: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    clubCardName: { fontSize: 15, fontWeight: '800', color: '#111827', marginTop: 4 },
    clubCardMeta: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginLeft: 3 },
    clubCardActions: { flexDirection: 'row' },
    catBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    catBadgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
    miniActionBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', marginLeft: 6 },

    /* Member view */
    backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 4 },
    backRowText: { color: theme.colors.primary, fontWeight: '700', fontSize: 14, marginLeft: 6 },
    memberScreenTitle: { fontSize: 20, fontWeight: '900', color: '#1E1B4B', marginBottom: 2 },
    memberScreenSub: { fontSize: 13, color: '#6B7280', marginBottom: 20 },
    memberCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6', elevation: 1 },
    memberAvatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    memberName: { fontSize: 14, fontWeight: '700', color: '#111827' },
    memberEmail: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
    rolePill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
    rolePillText: { fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
    memberActions: { flexDirection: 'row' },
    miniBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },

    /* Requests */
    requestCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    requestTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    reqClubBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, maxWidth: '70%' },
    reqClubText: { fontSize: 11, fontWeight: '700', marginLeft: 5 },
    timeAgoText: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
    requestUser: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    userAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    reqUserName: { fontSize: 15, fontWeight: '700', color: '#111827' },
    reqUserEmail: { fontSize: 12, color: '#6B7280', marginTop: 1 },
    reqStudentId: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
    reqMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 3, fontWeight: '600' },
    requestCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#F3F4F6', paddingTop: 12, marginTop: 4 },
    viewDetailHint: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    viewDetailText: { fontSize: 11, fontWeight: '700' },
    quickActions: { flexDirection: 'row', gap: 8 },
    quickApproveBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
    quickRejectBtn:  { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FECACA', justifyContent: 'center', alignItems: 'center' },

    /* Request Detail Modal */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', paddingBottom: 0 },
    modalHandle: { width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, alignSelf: 'center', marginTop: 14, marginBottom: 16 },
    modalTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
    modalSection: { paddingHorizontal: 20, marginBottom: 20 },
    modalSectionTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.2, marginBottom: 10 },
    applicantCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F3F4F6' },
    applicantAvatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: theme.colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    applicantName: { fontSize: 16, fontWeight: '800', color: '#111827' },
    applicantEmail: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    applicantId: { fontSize: 11, color: '#9CA3AF', marginTop: 1, fontWeight: '600' },
    detailsCard: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F3F4F6' },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    infoIconWrap: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    infoLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
    infoValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
    textBlock: { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#F3F4F6' },
    textBlockContent: { fontSize: 14, color: '#374151', lineHeight: 22 },
    modalFooter: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderColor: '#F3F4F6', gap: 12, backgroundColor: '#FFF' },
    approveBtnFull: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 15, gap: 7 },
    approveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
    rejectBtnFull:  { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 15, borderWidth: 1.5, borderColor: '#FECACA', gap: 7 },
    rejectBtnText:  { color: '#EF4444', fontWeight: '800', fontSize: 15 },

    emptySearch: { alignItems: 'center', marginTop: 60 },
    emptySearchText: { color: '#9CA3AF', marginTop: 12, fontSize: 16, fontWeight: '700' },
});

export default AdminClubManagementScreen;

