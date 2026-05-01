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
}