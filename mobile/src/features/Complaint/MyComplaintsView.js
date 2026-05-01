import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { theme } from '../../theme/theme';
import { AuthContext } from '../../context/AuthContext';
import { BASE_URL } from '../../config/api';
import ReportCard from './ReportCard';

const MyComplaintsView = ({ setGlobalAlert }) => {
    const { token } = useContext(AuthContext);
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPosting, setIsPosting] = useState(false);

    // Form State
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newImage, setNewImage] = useState(null);

    useEffect(() => {
        fetchMyReports();
    }, []);

    const fetchMyReports = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/reports/my`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.status === 'success') {
                setReports(response.data.data);
            }
        } catch (error) {
            console.error('Fetch my reports error:', error);
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
            setGlobalAlert({ visible: true, title: 'Incomplete', message: 'Please provide a title and description.', type: 'error' });
            return;
        }

        setIsPosting(true);
        try {
            const response = await axios.post(`${BASE_URL}/reports`, {
                title: newTitle,
                description: newDesc,
                image: newImage,
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.status === 'success') {
                setNewTitle('');
                setNewDesc('');
                setNewImage(null);
                fetchMyReports();
                setGlobalAlert({ 
                    visible: true, 
                    title: 'Report Submitted', 
                    message: 'Your issue has been reported successfully.', 
                    type: 'success' 
                });
            }
        } catch (error) {
            setGlobalAlert({ visible: true, title: 'Post Failed', message: 'Unable to submit report.', type: 'error' });
        } finally {
            setIsPosting(false);
        }
    };

    const handleDeleteReport = (id) => {
        Alert.alert(
            'Delete Report',
            'Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await axios.delete(`${BASE_URL}/reports/${id}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (response.data.status === 'success') {
                                fetchMyReports();
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Could not delete.');
                        }
                    } 
                }
            ]
        );
    };

    const pendingCount = reports.filter(r => r.status === 'Pending' || r.status === 'InProgress').length;
    const resolvedCount = reports.filter(r => r.status === 'Resolved').length;

    return (
        <View style={styles.container}>
            {/* Dashboard Stats */}
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

            {/* Add Report Form */}
            <Text style={styles.newReportHeading}>Report New Issue</Text>
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

                {newImage ? (
                    <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: newImage }} style={styles.imagePreview} />
                        <TouchableOpacity style={styles.deleteImageBtn} onPress={() => setNewImage(null)}>
                            <Ionicons name="trash" size={16} color={theme.colors.white} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.formUploadBtn} onPress={pickImage} disabled={isPosting}>
                        <Ionicons name="cloud-upload" size={36} color="#8A94AF" />
                        <Text style={styles.formUploadBtnText}>Tap to upload photos or docs</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.formSubmitBtn} onPress={handlePostReport} disabled={isPosting}>
                    {isPosting ? (
                        <ActivityIndicator color={theme.colors.white} />
                    ) : (
                        <>
                            <Ionicons name="send" size={18} color={theme.colors.white} style={{ marginRight: 8 }} />
                            <Text style={styles.formSubmitBtnText}>Submit Report</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* List Header */}
            {reports.length > 0 && (
                <Text style={styles.pastComplaintsHeading}>Past Complaints</Text>
            )}

            {/* Personal Reports List */}
            {isLoading && reports.length === 0 ? (
                <ActivityIndicator color={theme.colors.primary} size="large" style={{ marginTop: 20 }} />
            ) : reports.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No personal reports yet.</Text>
                </View>
            ) : (
                reports.map((item) => (
                    <ReportCard key={item._id} item={item} isOwner={true} onDelete={handleDeleteReport} />
                ))
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 10,
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
        marginTop: 16,
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
        marginTop: 16,
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
    pastComplaintsHeading: {
        paddingHorizontal: 24,
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.textMain,
        marginBottom: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyText: {
        color: theme.colors.textSub,
        fontSize: 14,
    },
});

export default MyComplaintsView;
