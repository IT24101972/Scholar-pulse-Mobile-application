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
