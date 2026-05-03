import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Image, Modal, TextInput, Platform, SafeAreaView, KeyboardAvoidingView, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { theme } from '../../theme/theme';
import { AuthContext } from '../../context/AuthContext';
import { BASE_URL } from '../../config/api';
import CustomModal from '../../components/CustomModal';

export default function ReportsScreen() {
    const { currentUser, token } = useContext(AuthContext);
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('All'); // 'All' | 'My'
    const scrollY = React.useRef(new Animated.Value(0)).current;
    // Add Report Form State
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newImage, setNewImage] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Custom Modal (Success/Error)
    const [alertModal, setAlertModal] = useState({ visible: false, title: '', message: '', type: 'success' });

    useEffect(() => {
        if (token) {
            fetchReports();
        }
    }, [token]);

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/reports`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Backend returns { status: 'success', data: [...] }
            setReports(res.data.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setNewImage(result.assets[0].uri);
        }
    };

    const handlePostReport = async () => {
        if (!newTitle.trim() || !newDesc.trim()) {
            setAlertModal({ visible: true, title: 'Incomplete', message: 'Please provide a title and description.', type: 'error' });
            return;
        }

        try {
            const fData = new FormData();
            fData.append('title', newTitle.trim());
            fData.append('description', newDesc.trim());

            if (newImage && !newImage.startsWith('/uploads')) {
                const filename = newImage.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';
                fData.append('image', { uri: newImage, name: filename, type });
            }

            if (isEditing) {
                const res = await axios.put(`${BASE_URL}/reports/${editingId}`, fData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                });

                setReports(reports.map(r => (r._id === editingId || r.id === editingId) ? res.data.data : r));
                setAlertModal({ visible: true, title: 'Report Updated', message: 'Your complaint has been successfully updated.', type: 'success' });
            } else {
                const res = await axios.post(`${BASE_URL}/reports`, fData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                });

                // Add the new report to the local state (at the top)
                setReports([res.data.data, ...reports]);
                setTimeout(() => {
                    setAlertModal({ visible: true, title: 'Report Submitted', message: 'Your issue has been reported successfully and is now pending review.', type: 'success' });
                }, 300);
            }

            setNewTitle('');
            setNewDesc('');
            setNewImage(null);
            setIsEditing(false);
            setEditingId(null);
            setActiveTab('My'); // Switch to 'My' so they see their post

        } catch (error) {
            console.error('Error post/put report:', error);
            setAlertModal({ visible: true, title: 'Error', message: 'Failed to save report. Please try again.', type: 'error' });
        }
    };

    const handleEditReport = (report) => {
        setNewTitle(report.title);
        setNewDesc(report.description);
        setNewImage(report.image ? (report.image.startsWith('http') || report.image.startsWith('file') ? report.image : `${BASE_URL.replace('/api', '')}${report.image}`) : null);
        setIsEditing(true);
        setEditingId(report._id || report.id);
        // Scroll to top (if using a scroll view ref) - relying on user to scroll up is okay
    };

    const cancelEdit = () => {
        setNewTitle('');
        setNewDesc('');
        setNewImage(null);
        setIsEditing(false);
        setEditingId(null);
    };

    // Filter reports - Match by author ID
    const filteredReports = activeTab === 'All'
        ? reports
        : reports.filter(r => r.author === currentUser?._id || r.authorId === currentUser?.studentId);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return theme.colors.statusPending;
            case 'InProgress': return theme.colors.statusInProgress;
            case 'Resolved': return theme.colors.statusResolved;
            default: return theme.colors.textSub;
        }
    };

    const handleDeleteReport = async (id) => {
        try {
            await axios.delete(`${BASE_URL}/reports/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReports(reports.filter(r => (r._id || r.id) !== id));
            setAlertModal({ visible: true, title: 'Report Deleted', message: 'Your complaint has been removed successfully.', type: 'success' });
        } catch (error) {
            console.error('Error deleting report:', error);
            setAlertModal({ visible: true, title: 'Error', message: 'Failed to delete report.', type: 'error' });
        }
    };

    const StatusBadge = ({ status }) => (
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '1A' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                {status === 'InProgress' ? 'In Progress' : status}
            </Text>
        </View>
    );

    const renderReportCard = ({ item }) => {
        const reportDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : (item.date || 'Today');
        const reportTime = item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (item.time || '');

        return (
            <View key={item._id || item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    <StatusBadge status={item.status} />
                </View>
                <Text style={styles.cardDesc}>{item.description}</Text>

                {item.image && (
                    <Image
                        source={{ uri: item.image.startsWith('http') || item.image.startsWith('file') ? item.image : `${BASE_URL.replace('/api', '')}${item.image}` }}
                        style={styles.cardImage}
                    />
                )}

                <View style={styles.cardFooter}>
                    <View style={styles.dateContainer}>
                        <Ionicons name="calendar-outline" size={14} color={theme.colors.textSub} />
                        <Text style={styles.dateText}>{reportDate}</Text>
                    </View>
                    <View style={styles.dateContainer}>
                        <Ionicons name="time-outline" size={14} color={theme.colors.textSub} />
                        <Text style={styles.dateText}>{reportTime}</Text>
                    </View>
                    {(item.author === currentUser?._id || item.authorId === currentUser?.studentId) && activeTab === 'My' && (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                                style={[styles.deleteActionBtn, { backgroundColor: '#EEF2FF', borderColor: '#E0E7FF' }]}
                                onPress={() => handleEditReport(item)}
                            >
                                <Ionicons name="pencil-outline" size={18} color="#4F46E5" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.deleteActionBtn}
                                onPress={() => handleDeleteReport(item._id || item.id)}
                            >
                                <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const myReportsCount = reports.filter(r =>
        (currentUser?.studentId && r.authorId === currentUser.studentId) ||
        (r.authorEmail === (currentUser?.email || 'student@campus.edu'))
    );
    const pendingCount = myReportsCount.filter(r => r.status === 'Pending' || r.status === 'InProgress').length;
    const resolvedCount = myReportsCount.filter(r => r.status === 'Resolved').length;

    const renderMyComplaintsDashboard = () => (
        <View style={styles.dashboardContainer}>
            <View style={[styles.statCard, styles.statCardPending]}>
                <Ionicons name="clipboard-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.statCountText}>{pendingCount < 10 ? `0${pendingCount}` : pendingCount}</Text>
                <Text style={styles.statLabelText}>PENDING</Text>
            </View>
            <View style={[styles.statCard, styles.statCardResolved]}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#094529" />
                <Text style={[styles.statCountText, { color: '#094529' }]}>{resolvedCount < 10 ? `0${resolvedCount}` : resolvedCount}</Text>
                <Text style={[styles.statLabelText, { color: '#094529' }]}>RESOLVED</Text>
            </View>
        </View>
    );

    const renderAddReportForm = () => (
        <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.newReportHeading}>{isEditing ? 'Edit Issue' : 'Report New Issue'}</Text>
                {isEditing && (
                    <TouchableOpacity onPress={cancelEdit} style={{ padding: 4 }}>
                        <Text style={{ color: theme.colors.danger, fontWeight: '700', fontSize: 13 }}>Cancel Edit</Text>
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.inlineFormContainer}>
                <Text style={styles.formSectionLabel}>ISSUE TITLE</Text>
                <View style={styles.inlineInputContainer}>
                    <TextInput
                        style={styles.inlineInput}
                        placeholder="What is the problem?"
                        placeholderTextColor={theme.colors.textSub}
                        value={newTitle}
                        onChangeText={setNewTitle}
                    />
                </View>

                <Text style={[styles.formSectionLabel, { marginTop: 16 }]}>DETAILED DESCRIPTION</Text>
                <View style={[styles.inlineInputContainer, { height: 110, alignItems: 'flex-start', paddingTop: 16 }]}>
                    <TextInput
                        style={[styles.inlineInput, { textAlignVertical: 'top' }]}
                        placeholder="Provide as much detail as possible..."
                        placeholderTextColor={theme.colors.textSub}
                        multiline={true}
                        value={newDesc}
                        onChangeText={setNewDesc}
                    />
                </View>

                <Text style={[styles.formSectionLabel, { marginTop: 16 }]}>ATTACHMENTS</Text>
                {newImage ? (
                    <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: newImage }} style={styles.imagePreview} />
                        <TouchableOpacity style={styles.deleteImageBtn} onPress={() => setNewImage(null)}>
                            <Ionicons name="trash" size={16} color={theme.colors.white} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.formUploadBtn} onPress={pickImage}>
                        <Ionicons name="cloud-upload" size={36} color="#8A94AF" />
                        <Text style={styles.formUploadBtnText}>Tap to upload photos or docs</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.formSubmitBtn} onPress={handlePostReport}>
                    <Ionicons name={isEditing ? "save" : "send"} size={18} color={theme.colors.white} style={{ marginRight: 8 }} />
                    <Text style={styles.formSubmitBtnText}>{isEditing ? 'Save Changes' : 'Submit Report'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Top Header Information
    const renderListHeader = () => (
        <View style={styles.headerSection}>
            <View style={styles.titleRow}>
                <View>
                    <Text style={styles.subTitle}>SERVICE CENTER</Text>
                    <Text style={styles.mainTitle}>Active</Text>
                    <Text style={styles.mainTitle}>Reports</Text>
                </View>
                <Text style={styles.dateText}></Text>
            </View>
        </View>
    );

    // The Toggle Component (reusable)
    const renderToggle = () => (
        <View style={styles.toggleContainerWrapper}>
            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleBtn, activeTab === 'All' && styles.toggleBtnActive]}
                    onPress={() => setActiveTab('All')}
                >
                    <Text style={[styles.toggleText, activeTab === 'All' && styles.toggleTextActive]}>Community</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleBtn, activeTab === 'My' && styles.toggleBtnActive]}
                    onPress={() => setActiveTab('My')}
                >
                    <Text style={[styles.toggleText, activeTab === 'My' && styles.toggleTextActive]}>My Complaints</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Absolute Sticky Toggle - Appears when scrolled down */}
            <Animated.View style={[styles.absoluteStickyToggle, {
                opacity: scrollY.interpolate({
                    inputRange: [120, 160],
                    outputRange: [0, 1],
                    extrapolate: 'clamp'
                }),
                transform: [{
                    translateY: scrollY.interpolate({
                        inputRange: [120, 160],
                        outputRange: [-10, 0],
                        extrapolate: 'clamp'
                    })
                }]
            }]}>
                {renderToggle()}
            </Animated.View>

            <Animated.ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
            >
                {renderListHeader()}

                {/* Inline Toggle */}
                <View style={{ marginBottom: 20 }}>
                    {renderToggle()}
                </View>

                {isLoading ? (
                    <View style={{ paddingVertical: 50 }}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                ) : (
                    <>
                        {/* Dashboard & Form for 'My Complaints' */}
                        {activeTab === 'My' && (
                            <>
                                {renderMyComplaintsDashboard()}
                                {renderAddReportForm()}

                                {filteredReports.length > 0 && (
                                    <Text style={{ paddingHorizontal: 24, fontSize: 16, fontWeight: '800', color: theme.colors.textMain, marginBottom: 16 }}>
                                        Past Complaints
                                    </Text>
                                )}
                            </>
                        )}

                        {/* Report Cards */}
                        {filteredReports.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="document-text-outline" size={48} color={theme.colors.textSub} style={{ opacity: 0.4, marginBottom: 12 }} />
                                <Text style={styles.emptyText}>No reports found.</Text>
                            </View>
                        ) : (
                            filteredReports.map((item) => renderReportCard({ item }))
                        )}
                    </>
                )}
            </Animated.ScrollView>

            {/* Custom Alert Modal */}
            <CustomModal
                visible={alertModal.visible}
                onClose={() => setAlertModal({ ...alertModal, visible: false })}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    headerSection: {
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 15,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    subTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#3b4382',
        letterSpacing: 1,
        marginBottom: 5,
    },
    mainTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: theme.colors.textMain,
        lineHeight: 38,
    },
    dateText: {
        fontSize: 12,
        color: theme.colors.neutral,
        marginTop: 5,
    },
    absoluteStickyToggle: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 90 : 85, // Reduced to perfectly snap behind transparent navigation bar without leaving a gap
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: theme.colors.background,
        paddingTop: 10,
        paddingBottom: 10,
    },
    toggleContainerWrapper: {
        paddingHorizontal: 40, // Narrower centered toggle like the user preferred
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#EBECEF', // Soft gray for back of toggle
        borderRadius: 20,
        padding: 4,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 16,
        alignItems: 'center',
    },
    toggleBtnActive: {
        backgroundColor: theme.colors.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSub,
    },
    toggleTextActive: {
        color: theme.colors.textMain,
        fontWeight: '700',
    },
    listContent: {
        paddingHorizontal: 0,
        paddingTop: Platform.OS === 'ios' ? 100 : 120, // Clean space top
        paddingBottom: 120, // Space for FAB
    },
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 24,
        marginBottom: 20,
        // Seamless Profile-like Shadows
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textMain,
        marginRight: 10,
        lineHeight: 22,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    cardDesc: {
        fontSize: 14,
        color: theme.colors.textSub,
        lineHeight: 20,
        marginBottom: 16,
    },
    cardImage: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.04)',
        paddingTop: 16,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    dateText: {
        fontSize: 12,
        color: theme.colors.textSub,
        marginLeft: 6,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 24,
    },
    emptyText: {
        color: theme.colors.textSub,
        fontSize: 15,
        fontWeight: '500',
    },
    dashboardContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 26,
        gap: 16,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        padding: 20,
        justifyContent: 'flex-start',
    },
    statCardPending: {
        backgroundColor: '#F3F4FE',
    },
    statCardResolved: {
        backgroundColor: '#6EF2AA',
    },
    statCountText: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0D143D',
        marginTop: 12,
        marginBottom: 2,
    },
    statLabelText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#656A8F',
        letterSpacing: 1,
    },
    newReportHeading: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.textMain,
        paddingHorizontal: 24,
        marginBottom: 16,
        letterSpacing: -0.3,
    },
    inlineFormContainer: {
        backgroundColor: '#F3F4FE',
        marginHorizontal: 24,
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 24,
        marginBottom: 40,
    },
    formSectionLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: theme.colors.primary,
        marginBottom: 8,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    inlineInputContainer: {
        backgroundColor: '#E5E5FC',
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 52,
    },
    inlineInput: {
        flex: 1,
        color: theme.colors.textMain,
        fontSize: 14,
        fontWeight: '500',
    },
    formUploadBtn: {
        borderWidth: 2,
        borderColor: '#D0D0E8',
        borderStyle: 'dashed',
        borderRadius: 14,
        paddingVertical: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    formUploadBtnText: {
        color: '#70779A',
        fontWeight: '600',
        fontSize: 13,
        marginTop: 8,
    },
    imagePreviewContainer: {
        width: '100%',
        height: 200,
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 24,
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    deleteImageBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    formSubmitBtn: {
        backgroundColor: theme.colors.primary,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 18,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    formSubmitBtnText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: '800',
    },
    deleteActionBtn: {
        marginLeft: 'auto',
        backgroundColor: '#FEE2E2',
        padding: 8,
        borderRadius: 10,
    }
});
