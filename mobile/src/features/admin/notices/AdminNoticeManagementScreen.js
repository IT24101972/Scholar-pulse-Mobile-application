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