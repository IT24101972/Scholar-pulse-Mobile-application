import React, { useState, useEffect, useContext } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
    Alert, ActivityIndicator, Platform, Modal, KeyboardAvoidingView, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../../theme/theme';
import { AuthContext } from '../../../context/AuthContext';
import { BASE_URL } from '../../../config/api';

/* ── Constants ─────────────────────────────────────────────────────── */
const FACULTIES  = ['All', 'Computing', 'Business', 'Engineering', 'Law'];
const TYPE_OPTIONS = [
    { key: 'general', label: 'General', icon: 'document-text-outline',   color: '#0055FE' },
    { key: 'urgent',  label: 'Urgent',  icon: 'megaphone-outline',        color: '#EF4444' },
    { key: 'admin',   label: 'Admin',   icon: 'shield-checkmark-outline', color: '#F59E0B' },
];

const FACULTY_COLORS = {
    All:         '#0055FE',
    Computing:   '#6366F1',
    Business:    '#10B981',
    Engineering: '#F59E0B',
    Law:         '#EC4899',
};

const TYPE_COLORS = {
    general: '#0055FE',
    urgent:  '#EF4444',
    event:   '#10B981',
    admin:   '#F59E0B',
};

const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
};

/* ── Component ─────────────────────────────────────────────────────── */
const AdminNoticeManagementScreen = ({ navigation }) => {
    const { token } = useContext(AuthContext);
    const [activeTab,    setActiveTab]    = useState('add');
    const [isLoading,    setIsLoading]    = useState(false);
    const [notices,      setNotices]      = useState([]);
    const [isEditing,    setIsEditing]    = useState(false);
    const [editingId,    setEditingId]    = useState(null);
    const [searchQuery,  setSearchQuery]  = useState('');
    const [filterFaculty,setFilterFaculty]= useState('All');
    const [selectedImage, setSelectedImage] = useState(null);

    // Form state
    const EMPTY_FORM = {
        title:       '',
        description: '',
        faculty:     'All',
        type:        'general',
        isImportant: false,
    };
    const [formData, setFormData] = useState(EMPTY_FORM);

    useEffect(() => {
        if (activeTab === 'manage') fetchNotices();
    }, [activeTab]);

    /* ── Image helpers ──────────────────────────────────────────────── */
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload images!');
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 1,
        });
        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('file')) return url;
        const rootUrl = BASE_URL.replace('/api', '');
        return `${rootUrl}${url}`;
    };

    /* ── API calls ──────────────────────────────────────────────────── */
    const fetchNotices = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/notices`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotices(res.data.data || []);
        } catch (error) {
            console.error('Error fetching notices:', error);
            Alert.alert('Error', 'Could not load notices');
        } finally {
            setIsLoading(false);
        }
    };

    const prepareEdit = (notice) => {
        setEditingId(notice._id);
        setIsEditing(true);
        setFormData({
            title:       notice.title       || '',
            description: notice.description || '',
            faculty:     notice.faculty     || 'All',
            type:        notice.type        || 'general',
            isImportant: notice.isImportant || false,
        });
        setSelectedImage(notice.image || null);
        setActiveTab('add');
    };

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.description.trim()) {
            Alert.alert('Error', 'Title and Description are required');
            return;
        }

        setIsLoading(true);
        try {
            // Build a FormData payload so we match the upload middleware
            const fData = new FormData();
            fData.append('title',       formData.title.trim());
            fData.append('description', formData.description.trim());
            fData.append('faculty',     formData.faculty);
            fData.append('type',        formData.type);
            fData.append('isImportant', String(formData.isImportant));

            // Handle image – only append as file if it's a new local pick
            if (selectedImage && selectedImage.startsWith('file')) {
                const filename = selectedImage.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image';
                fData.append('image', { uri: selectedImage, name: filename, type });
            } else if (selectedImage) {
                fData.append('image', selectedImage);
            }

            const headers = {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            };

            if (isEditing) {
                await axios.put(`${BASE_URL}/notices/${editingId}`, fData, { headers });
                Alert.alert('Success', 'Notice updated successfully!');
            } else {
                await axios.post(`${BASE_URL}/notices`, fData, { headers });
                Alert.alert('Success', 'Notice published successfully!');
            }

            resetForm();
            setSelectedImage(null);
            setActiveTab('manage');
        } catch (error) {
            console.error('Notice save error:', error);
            const msg = error.response?.data?.message || 'Failed to save notice';
            Alert.alert('Error', msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Notice',
            'Are you sure you want to remove this notice?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`${BASE_URL}/notices/${id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            setNotices(prev => prev.filter(n => n._id !== id));
                        } catch {
                            Alert.alert('Error', 'Failed to delete notice');
                        }
                    }
                }
            ]
        );
    };

    const resetForm = () => {
        setFormData(EMPTY_FORM);
        setSelectedImage(null);
        setIsEditing(false);
        setEditingId(null);
    };

    /* ── Add / Edit Tab ─────────────────────────────────────────────── */
    const renderAddTab = () => (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>

                {/* Title */}
                <Text style={styles.inputLabel}>Notice Title *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Examination Schedule Update"
                    placeholderTextColor="#9CA3AF"
                    value={formData.title}
                    onChangeText={t => setFormData({ ...formData, title: t })}
                />

                {/* Type */}
                <Text style={styles.inputLabel}>Notice Type *</Text>
                <View style={styles.optionRow}>
                    {TYPE_OPTIONS.map(opt => {
                        const active = formData.type === opt.key;
                        return (
                            <TouchableOpacity
                                key={opt.key}
                                style={[
                                    styles.optionPill,
                                    active && { backgroundColor: opt.color, borderColor: opt.color }
                                ]}
                                onPress={() => setFormData({ ...formData, type: opt.key })}
                            >
                                <Ionicons
                                    name={opt.icon}
                                    size={14}
                                    color={active ? '#FFF' : opt.color}
                                />
                                <Text style={[styles.optionPillText, active && { color: '#FFF' }]}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Faculty */}
                <Text style={styles.inputLabel}>Target Faculty *</Text>
                <View style={styles.optionRow}>
                    {FACULTIES.map(fac => {
                        const active = formData.faculty === fac;
                        const col    = FACULTY_COLORS[fac];
                        return (
                            <TouchableOpacity
                                key={fac}
                                style={[
                                    styles.optionPill,
                                    active && { backgroundColor: col, borderColor: col }
                                ]}
                                onPress={() => setFormData({ ...formData, faculty: fac })}
                            >
                                <Text style={[styles.optionPillText, active && { color: '#FFF' }]}>
                                    {fac}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Description */}
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Write the full notice content here…"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={5}
                    value={formData.description}
                    onChangeText={t => setFormData({ ...formData, description: t })}
                />
                <Text style={styles.charCount}>{formData.description.length} characters</Text>

                {/* Cover Image */}
                <Text style={styles.inputLabel}>Cover Image (optional)</Text>
                <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                    {selectedImage ? (
                        <View style={{ width: '100%', height: '100%' }}>
                            <Image source={{ uri: getImageUrl(selectedImage) }} style={styles.imagePreview} />
                            <TouchableOpacity
                                style={styles.removeImageBtn}
                                onPress={() => setSelectedImage(null)}
                            >
                                <Ionicons name="close-circle" size={28} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
                            <Text style={styles.imagePlaceholderText}>Upload Notice Image</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Mark as Important */}
                <Text style={styles.inputLabel}>Priority</Text>
                <TouchableOpacity
                    style={[
                        styles.importantToggle,
                        formData.isImportant && styles.importantToggleActive
                    ]}
                    onPress={() => setFormData({ ...formData, isImportant: !formData.isImportant })}
                >
                    <Ionicons
                        name={formData.isImportant ? 'alert-circle' : 'alert-circle-outline'}
                        size={20}
                        color={formData.isImportant ? '#EF4444' : '#9CA3AF'}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.importantToggleTitle, formData.isImportant && { color: '#EF4444' }]}>
                            {formData.isImportant ? 'Marked as Important' : 'Mark as Important'}
                        </Text>
                        <Text style={styles.importantToggleSub}>
                            Displays a red banner at the top of the card
                        </Text>
                    </View>
                    <View style={[styles.toggleDot, formData.isImportant && styles.toggleDotActive]} />
                </TouchableOpacity>

                {/* Submit */}
                <TouchableOpacity
                    style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={isLoading}
                >
                    {isLoading
                        ? <ActivityIndicator color="#FFF" />
                        : (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons
                                    name={isEditing ? 'save-outline' : 'paper-plane-outline'}
                                    size={18}
                                    color="#FFF"
                                    style={{ marginRight: 8 }}
                                />
                                <Text style={styles.submitBtnText}>
                                    {isEditing ? 'Update Notice' : 'Publish Notice'}
                                </Text>
                            </View>
                        )
                    }
                </TouchableOpacity>

                {isEditing && (
                    <TouchableOpacity style={styles.cancelEditBtn} onPress={() => {
                        resetForm();
                        setActiveTab('manage');
                    }}>
                        <Text style={styles.cancelEditText}>Cancel Edit</Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 110 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );

    /* ── Manage Tab ─────────────────────────────────────────────────── */
    const renderManageTab = () => {
        const filtered = notices.filter(n => {
            const matchSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                n.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchFaculty = filterFaculty === 'All' || n.faculty === filterFaculty || n.faculty === 'All';
            return matchSearch && matchFaculty;
        });

        return (
            <ScrollView style={styles.manageContainer} showsVerticalScrollIndicator={false}>

                {/* Search bar */}
                <View style={styles.searchWrapper}>
                    <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search notices…"
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

                {/* Faculty filter pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                    {FACULTIES.map(fac => {
                        const active = filterFaculty === fac;
                        const col    = FACULTY_COLORS[fac];
                        return (
                            <TouchableOpacity
                                key={fac}
                                style={[
                                    styles.miniFilter,
                                    active && { backgroundColor: col, borderColor: col }
                                ]}
                                onPress={() => setFilterFaculty(fac)}
                            >
                                <Text style={[styles.miniFilterText, active && { color: '#FFF' }]}>{fac}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {isLoading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
                ) : filtered.length > 0 ? (
                    filtered.map(notice => {
                        const typeColor   = TYPE_COLORS[notice.type]   || theme.colors.primary;
                        const facultyColor = FACULTY_COLORS[notice.faculty] || theme.colors.primary;
                        return (
                            <View key={notice._id} style={styles.noticeCard}>
                                {/* Top Row – badges + actions */}
                                <View style={styles.noticeCardTop}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <View style={[styles.typeBadge, { backgroundColor: typeColor + '18' }]}>
                                            <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                                                {notice.type.toUpperCase()}
                                            </Text>
                                        </View>
                                        {notice.faculty !== 'All' && (
                                            <View style={[styles.facBadge, { backgroundColor: facultyColor + '18' }]}>
                                                <Text style={[styles.facBadgeText, { color: facultyColor }]}>
                                                    {notice.faculty}
                                                </Text>
                                            </View>
                                        )}
                                        {notice.isImportant && (
                                            <View style={styles.importantDot}>
                                                <Ionicons name="alert-circle" size={12} color="#EF4444" />
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.cardActions}>
                                        <TouchableOpacity
                                            style={styles.miniActionBtn}
                                            onPress={() => prepareEdit(notice)}
                                        >
                                            <Ionicons name="create-outline" size={17} color="#4B5563" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.miniActionBtn, { marginLeft: 8 }]}
                                            onPress={() => handleDelete(notice._id)}
                                        >
                                            <Ionicons name="trash-outline" size={17} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Title & desc */}
                                <Text style={styles.noticeCardTitle} numberOfLines={2}>
                                    {notice.title}
                                </Text>
                                <Text style={styles.noticeCardDesc} numberOfLines={2}>
                                    {notice.description}
                                </Text>

                                {/* Footer */}
                                <View style={styles.noticeCardFooter}>
                                    {notice.attachment ? (
                                        <View style={styles.attachChip}>
                                            <Ionicons name="attach" size={12} color={theme.colors.primary} />
                                            <Text style={styles.attachChipText}>Attachment</Text>
                                        </View>
                                    ) : <View />}
                                    <Text style={styles.timeText}>{getTimeAgo(notice.createdAt)}</Text>
                                </View>
                            </View>
                        );
                    })
                ) : (
                    <View style={styles.emptySearch}>
                        <Ionicons name="search-outline" size={48} color="#E5E7EB" />
                        <Text style={styles.emptySearchText}>No notices found</Text>
                    </View>
                )}

                <View style={{ height: 110 }} />
            </ScrollView>
        );
    };

    /* ── Root Render ────────────────────────────────────────────────── */
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.managementHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1E1B4B" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Notices Management</Text>
                    <Text style={styles.headerSub}>
                        {notices.length} notice{notices.length !== 1 ? 's' : ''} published
                    </Text>
                </View>
            </View>

            {/* Toggle */}
            <View style={styles.toggleWrapper}>
                <View style={styles.toggleBackground}>
                    <TouchableOpacity
                        style={[styles.toggleOption, activeTab === 'add' && styles.toggleOptionActive]}
                        onPress={() => {
                            if (!isEditing) resetForm();
                            setActiveTab('add');
                        }}
                    >
                        <Ionicons
                            name={isEditing ? 'create-outline' : 'add-circle-outline'}
                            size={16}
                            color={activeTab === 'add' ? theme.colors.primary : '#6B7280'}
                            style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.toggleText, activeTab === 'add' && styles.toggleTextActive]}>
                            {isEditing ? 'Edit Notice' : 'Add Notice'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleOption, activeTab === 'manage' && styles.toggleOptionActive]}
                        onPress={() => setActiveTab('manage')}
                    >
                        <Ionicons
                            name="list-outline"
                            size={16}
                            color={activeTab === 'manage' ? theme.colors.primary : '#6B7280'}
                            style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.toggleText, activeTab === 'manage' && styles.toggleTextActive]}>
                            Manage Notices
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {activeTab === 'add' ? renderAddTab() : renderManageTab()}
        </View>
    );
};

/* ── Styles ─────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },

    /* Header */
    managementHeader: {
        paddingTop: 60,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backBtn: { padding: 4, marginRight: 14 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E1B4B' },
    headerSub:   { fontSize: 12, color: '#6B7280', fontWeight: '500', marginTop: 2 },

    /* Toggle */
    toggleWrapper:    { paddingHorizontal: 24, marginBottom: 24 },
    toggleBackground: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 16, padding: 4 },
    toggleOption: {
        flex: 1, flexDirection: 'row', justifyContent: 'center',
        alignItems: 'center', paddingVertical: 12, borderRadius: 12,
    },
    toggleOptionActive: {
        backgroundColor: '#FFF',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
    },
    toggleText:       { fontSize: 13, fontWeight: '600', color: '#6B7280' },
    toggleTextActive: { color: theme.colors.primary, fontWeight: '700' },

    /* Form */
    formContainer: { paddingHorizontal: 24 },
    inputLabel: {
        fontSize: 13, fontWeight: '700', color: '#4B5563',
        marginBottom: 8, marginTop: 18,
    },
    input: {
        backgroundColor: '#FFF', borderRadius: 14, padding: 14,
        fontSize: 15, color: '#1E1B4B', borderWidth: 1, borderColor: '#E5E7EB',
    },
    textArea:  { height: 120, textAlignVertical: 'top' },
    charCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4, fontWeight: '600' },

    optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    optionPill: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 9,
        borderRadius: 22, backgroundColor: '#FFF',
        borderWidth: 1.5, borderColor: '#E5E7EB',
    },
    optionPillText: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginLeft: 5 },

    /* Important toggle */
    importantToggle: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF', borderRadius: 14,
        padding: 14, borderWidth: 1.5, borderColor: '#E5E7EB',
    },
    importantToggleActive: { borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' },
    importantToggleTitle: { fontSize: 14, fontWeight: '700', color: '#4B5563' },
    importantToggleSub:   { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    toggleDot: {
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: '#E5E7EB', borderWidth: 2, borderColor: '#D1D5DB',
    },
    toggleDotActive: { backgroundColor: '#EF4444', borderColor: '#EF4444' },

    /* Submit */
    submitBtn: {
        backgroundColor: theme.colors.primary, borderRadius: 16,
        paddingVertical: 16, alignItems: 'center', marginTop: 28,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    cancelEditBtn: {
        alignItems: 'center', paddingVertical: 14, marginTop: 10,
        borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB',
    },
    cancelEditText: { color: '#6B7280', fontWeight: '700', fontSize: 14 },

    /* Manage tab */
    manageContainer: { paddingHorizontal: 20 },
    searchWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF', borderRadius: 16,
        paddingHorizontal: 16, height: 50, marginBottom: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 5, elevation: 1,
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1F2937' },

    miniFilter: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#FFF', marginRight: 8,
        borderWidth: 1.5, borderColor: '#E5E7EB',
    },
    miniFilterText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },

    /* Notice card (manage tab) */
    noticeCard: {
        backgroundColor: '#FFF', borderRadius: 20, padding: 16,
        marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    },
    noticeCardTop: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 10,
    },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    typeBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    facBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    facBadgeText: { fontSize: 10, fontWeight: '700' },
    importantDot: {
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center',
    },
    cardActions: { flexDirection: 'row' },
    miniActionBtn: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center',
    },
    noticeCardTitle: {
        fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 5, lineHeight: 22,
    },
    noticeCardDesc: {
        fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 12,
    },
    noticeCardFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    attachChip: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    },
    attachChipText: { fontSize: 11, fontWeight: '700', color: '#0055FE', marginLeft: 4 },
    timeText: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },

    /* Image Picker */
    imagePickerBtn: {
        backgroundColor: '#FFF',
        height: 180,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePreview: { width: '100%', height: '100%' },
    imagePlaceholder: { alignItems: 'center' },
    imagePlaceholderText: { color: '#9CA3AF', marginTop: 8, fontWeight: '600' },
    removeImageBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },

    /* Empty */
    emptySearch:     { alignItems: 'center', marginTop: 60 },
    emptySearchText: { color: '#9CA3AF', marginTop: 12, fontSize: 15, fontWeight: '500' },
});

export default AdminNoticeManagementScreen;
