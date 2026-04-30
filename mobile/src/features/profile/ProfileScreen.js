import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, LayoutAnimation, Platform, UIManager, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../theme/theme';
import { AuthContext } from '../../context/AuthContext';
import CustomModal from '../../components/CustomModal';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ProfileScreen({ navigation }) {
    const { currentUser, logout, updateProfile, isLoading } = useContext(AuthContext);

    // Form States
    const DEFAULT_PLACEHOLDER = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    const [profileImage, setProfileImage] = useState(currentUser?.avatar || DEFAULT_PLACEHOLDER);
    
    // nameInput is what the user types. We only update the global state/display name after clicking Save.
    const [nameInput, setNameInput] = useState(currentUser?.fullName || '');
    
    // Security Accordion State
    const [isPasswordExpanded, setIsPasswordExpanded] = useState(false);
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');

    // --- Custom Modal Logic ---
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: '', message: '', type: 'success' });

    const showModal = (title, message, type = 'success') => {
        setModalConfig({ title, message, type });
        setModalVisible(true);
    };

    useEffect(() => {
        if(currentUser) {
            setNameInput(currentUser.fullName);
            if (currentUser.avatar) {
                setProfileImage(currentUser.avatar);
            }
        }
    }, [currentUser]);

    const validatePassword = (passText) => {
        const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
        return re.test(passText);
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
        }
    };

    const togglePasswordSection = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsPasswordExpanded(!isPasswordExpanded);
    };

    const handleSaveDetails = async () => {
        if (!nameInput.trim()) {
            return showModal("Invalid Input", "Name cannot be empty", "error");
        }
        
        try {
            await updateProfile(nameInput, null);
            showModal("Profile Updated", "Your changes have been saved successfully across the Scholar Pulse network.", "success");
        } catch(err) {
            console.log("Update Error:", err);
            showModal("Update Failed", err.message || "Could not update profile", "error");
        }
    };

    const handlePasswordUpdate = async () => {
        if (!newPass || !confirmPass) {
            return showModal("Invalid Input", "Please fill both password fields", "error");
        }
        if (newPass !== confirmPass) {
            return showModal("Password Mismatch", "Passwords do not match", "error");
        }
        if (!validatePassword(newPass)) {
            return showModal("Weak Password", "Password must be at least 6 characters long and contain at least one letter and one number.", "error");
        }
        
        try {
            await updateProfile(nameInput, newPass);
            showModal("Password Updated", "Your password has been changed successfully.", "success");
            setNewPass('');
            setConfirmPass('');
            togglePasswordSection();
        } catch(err) {
            showModal("Update Failed", err.message || "Could not update password", "error");
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    return (
        <View style={styles.container}>
            {/* Custom Reusable Modal Overlay */}
            <CustomModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header & Avatar */}
                <View style={styles.headerSection}>
                    <View style={styles.avatarContainer}>
                        <Image source={{ uri: profileImage }} style={styles.avatar} />
                        <TouchableOpacity style={styles.cameraFab} onPress={pickImage}>
                            <Ionicons name="camera" size={16} color={theme.colors.white} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{currentUser?.fullName}</Text>
                    <Text style={styles.userMajor}>COMPUTER SCIENCE MAJOR</Text>
                </View>

                {/* Personal Information */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>FULLNAME</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={nameInput}
                            onChangeText={setNameInput}
                        />
                        <Ionicons name="pencil" size={16} color={theme.colors.textSub} style={{ padding: 10 }} />
                    </View>

                    <Text style={[styles.label, { marginTop: 16 }]}>CAMPUS EMAIL</Text>
                    <View style={[styles.inputContainer, styles.disabledInput]}>
                        <Ionicons name="lock-closed" size={14} color={theme.colors.textSub} style={styles.lockIcon} />
                        <TextInput
                            style={[styles.input, { color: theme.colors.textSub }]}
                            value={currentUser?.email || "loading..."}
                            editable={false}
                        />
                    </View>

                    <Text style={[styles.label, { marginTop: 16 }]}>STUDENT ID</Text>
                    <View style={[styles.inputContainer, styles.disabledInput]}>
                        <Ionicons name="lock-closed" size={14} color={theme.colors.textSub} style={styles.lockIcon} />
                        <TextInput
                            style={[styles.input, { color: theme.colors.textSub }]}
                            value={currentUser?.studentId || "loading..."}
                            editable={false}
                        />
                    </View>

                    <TouchableOpacity style={styles.primaryButton} onPress={handleSaveDetails} disabled={isLoading}>
                        <Ionicons name="save-outline" size={18} color={theme.colors.white} style={{ marginRight: 8 }} />
                        <Text style={styles.primaryButtonText}>{isLoading ? "Saving..." : "Save Details"}</Text>
                    </TouchableOpacity>
                </View>

                {/* Security & Privacy */}
                <View style={[styles.sectionHeaderRow, { marginTop: 10 }]}>
                    <Text style={styles.sectionTitle}>Security & Privacy</Text>
                </View>

                <View style={styles.card}>
                    {/* Password Accordion Toggle */}
                    <TouchableOpacity style={styles.listItem} onPress={togglePasswordSection}>
                        <View style={styles.iconBgBlue}>
                            <Ionicons name="ellipsis-horizontal" size={18} color={theme.colors.primary} />
                        </View>
                        <View style={styles.listItemTextContainer}>
                            <Text style={styles.listItemTitle}>Change Password</Text>
                            <Text style={styles.listItemSub}>Last changed 1 day ago</Text>
                        </View>
                        <Ionicons
                            name={isPasswordExpanded ? "chevron-up" : "chevron-forward"}
                            size={20}
                            color={theme.colors.textSub}
                        />
                    </TouchableOpacity>

                    {/* Expandable Password Content */}
                    {isPasswordExpanded && (
                        <View style={styles.expandedContent}>
                            <Text style={styles.label}>NEW PASSWORD</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    secureTextEntry
                                    value={newPass}
                                    onChangeText={setNewPass}
                                />
                            </View>

                            <Text style={[styles.label, { marginTop: 16 }]}>RE-ENTER PASSWORD</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    secureTextEntry
                                    value={confirmPass}
                                    onChangeText={setConfirmPass}
                                />
                            </View>

                            <TouchableOpacity style={styles.confirmButton} onPress={handlePasswordUpdate} disabled={isLoading}>
                                <Ionicons name="shield-checkmark" size={18} color={theme.colors.white} style={{ marginRight: 8 }} />
                                <Text style={styles.confirmButtonText}>{isLoading ? "Updating..." : "Confirm Update"}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.listItem}>
                        <View style={styles.iconBgGreen}>
                            <Ionicons name="shield-half" size={18} color={theme.colors.secondary} />
                        </View>
                        <View style={styles.listItemTextContainer}>
                            <Text style={styles.listItemTitle}>Update Security Questions</Text>
                            <Text style={styles.listItemSub}>Secure your account recovery</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSub} />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} style={{ marginRight: 8 }} />
                    <Text style={styles.logoutBtnText}>Log Out</Text>
                </TouchableOpacity>

                {/* Padding to allow scrolling over bottom nav */}
                <View style={{ height: 100 }} />

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        paddingTop: 100, // accommodate transparent header
        paddingHorizontal: 20,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: theme.colors.white,
    },
    cameraFab: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.white,
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.textMain,
        marginBottom: 4,
    },
    userMajor: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.primary,
        letterSpacing: 0.5,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.textMain,
    },
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        // Seamless Shadow style
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 4,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.textSub,
        marginBottom: 8,
        letterSpacing: 1,
    },
    inputContainer: {
        backgroundColor: theme.colors.inputBg, // Clean, light gray background
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
    },
    input: {
        flex: 1,
        paddingHorizontal: 16,
        color: theme.colors.textMain,
        fontSize: 14,
        fontWeight: '500',
    },
    disabledInput: {
        backgroundColor: theme.colors.background, // lighter/grayer
        opacity: 0.7,
    },
    lockIcon: {
        marginLeft: 16,
        marginRight: -4,
    },
    primaryButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        marginTop: 24,
    },
    primaryButtonText: {
        color: theme.colors.white,
        fontSize: 15,
        fontWeight: '700',
    },
    confirmButton: {
        backgroundColor: theme.colors.textMain, // Dark navy for security confirm
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        marginTop: 16,
    },
    confirmButtonText: {
        color: theme.colors.white,
        fontSize: 14,
        fontWeight: '700',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    iconBgBlue: {
        backgroundColor: theme.colors.primaryLight,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    iconBgGreen: {
        backgroundColor: '#D1FAE5', // very light green
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    listItemTextContainer: {
        flex: 1,
    },
    listItemTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.textMain,
        marginBottom: 2,
    },
    listItemSub: {
        fontSize: 12,
        color: theme.colors.textSub,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)', // Almost invisible divider
        marginVertical: 16,
    },
    expandedContent: {
        backgroundColor: theme.colors.background, // Contrast background
        padding: 24,
        borderRadius: 18,
        marginTop: 12,
        marginBottom: 8,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: theme.colors.white,
        marginTop: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(225, 29, 72, 0.3)', // delicate red outline
    },
    logoutBtnText: {
        color: theme.colors.danger,
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    mainSaveButton: {
        backgroundColor: theme.colors.primary, 
        borderRadius: 25, // Pill shape like Login
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 54,
        marginTop: 10,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    mainSaveButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    disclaimerText: {
        fontSize: 11,
        color: theme.colors.textSub,
        textAlign: 'center',
        marginTop: 20,
        lineHeight: 16,
        paddingHorizontal: 10,
    }
});
