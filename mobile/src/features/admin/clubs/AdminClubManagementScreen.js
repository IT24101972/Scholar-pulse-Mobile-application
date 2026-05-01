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
}