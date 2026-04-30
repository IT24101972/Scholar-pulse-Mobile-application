import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Image, Platform, Modal, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { theme } from '../../../theme/theme';
import { AuthContext } from '../../../context/AuthContext';
import { BASE_URL } from '../../../config/api';

const AdminEventManagementScreen = ({ navigation }) => {
    const { token, currentUser } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('add'); // 'add' or 'manage'
    const [isLoading, setIsLoading] = useState(false);
    const [events, setEvents] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        category: 'Social',
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        location: '',
        description: '',
        isFeatured: false,
        baseInterestedCount: 0
    });
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);

    // Picker states
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    useEffect(() => {
        if (activeTab === 'manage') {
            fetchEvents();
        }
    }, [activeTab]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
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

    const pickVideo = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['videos'],
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setSelectedVideo(result.assets[0].uri);
        }
    };

    const getImageUrl = (url) => {
        if (!url) return 'https://via.placeholder.com/400x200';
        if (url.startsWith('http') || url.startsWith('file')) return url;
        const rootUrl = BASE_URL.replace('/api', '');
        return `${rootUrl}${url}`;
    };

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/events`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEvents(res.data.data);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const parseTimeString = (timeStr) => {
        try {
            const [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':');
            if (hours === '12') hours = '00';
            if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
            const d = new Date();
            d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
            return d;
        } catch (e) {
            return new Date();
        }
    };

    const prepareEdit = (event) => {
        setEditingId(event._id);
        setIsEditing(true);
        
        // Parse time: "10:00 AM - 12:00 PM"
        const times = event.time.split(' - ');
        
        setFormData({
            title: event.title,
            category: event.category,
            date: new Date(event.date),
            startTime: parseTimeString(times[0]),
            endTime: parseTimeString(times[1]),
            location: event.location,
            description: event.description,
            isFeatured: event.isFeatured,
            baseInterestedCount: event.baseInterestedCount || 0
        });
        setSelectedImage(event.image);
        setSelectedVideo(event.video || null);
        setActiveTab('add');
    };

    const handleAddEvent = async () => {
        if (!formData.title || !formData.location || !formData.description || !selectedImage) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        if (formData.description.length > 250) {
            Alert.alert('Error', 'Description must be under 250 characters');
            return;
        }

        setIsLoading(true);
        try {
            const fData = new FormData();
            fData.append('title', formData.title);
            fData.append('category', formData.category);
            fData.append('date', formData.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
            fData.append('time', `${formData.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${formData.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
            fData.append('location', formData.location);
            fData.append('description', formData.description);
            fData.append('isFeatured', formData.isFeatured);
            fData.append('baseInterestedCount', formData.baseInterestedCount);

            // Handle Image - only append if it's a new file (asset)
            if (selectedImage && selectedImage.startsWith('file')) {
                const filename = selectedImage.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;
                fData.append('image', { uri: selectedImage, name: filename, type });
            } else {
                fData.append('image', selectedImage);
            }

            // Handle Video
            if (selectedVideo && selectedVideo.startsWith('file')) {
                const filename = selectedVideo.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `video/${match[1]}` : `video/mp4`;
                fData.append('video', { uri: selectedVideo, name: filename, type });
            } else if (selectedVideo) {
                fData.append('video', selectedVideo);
            }

            if (isEditing) {
                await axios.put(`${BASE_URL}/events/${editingId}`, fData, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                Alert.alert('Success', 'Event updated successfully!');
            } else {
                await axios.post(`${BASE_URL}/events`, fData, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                Alert.alert('Success', 'Event created successfully!');
            }
            // Reset form
            setFormData({
                title: '',
                category: 'Social',
                date: new Date(),
                startTime: new Date(),
                endTime: new Date(),
                location: '',
                description: '',
                isFeatured: false,
                baseInterestedCount: 0
            });
            setSelectedImage(null);
            setSelectedVideo(null);
            setIsEditing(false);
            setEditingId(null);
            setActiveTab('manage');
        } catch (error) {
            console.error('Error processing event:', error);
            const errorMsg = error.response?.data?.message || 'Failed to process event';
            Alert.alert('Error', errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteEvent = (id) => {
        Alert.alert(
            'Delete Event',
            'Are you sure you want to remove this event?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`${BASE_URL}/events/${id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            setEvents(events.filter(e => e._id !== id));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete event');
                        }
                    }
                }
            ]
        );
    };

    const renderAddTab = () => (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Event Title</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="e.g. Annual Tech Symposium"
                    value={formData.title}
                    onChangeText={(text) => setFormData({...formData, title: text})}
                />

                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryRow}>
                    {['Social', 'Academic', 'Sports', 'Workshops'].map(cat => (
                        <TouchableOpacity 
                            key={cat} 
                            style={[styles.catPill, formData.category === cat && styles.catPillActive]}
                            onPress={() => setFormData({...formData, category: cat})}
                        >
                            <Text style={[styles.catPillText, formData.category === cat && styles.catPillTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.inputLabel}>Date</Text>
                        <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowDatePicker(true)}>
                            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                            <Text style={styles.dateTimeText}>{formData.date.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.inputLabel}>Show in Slider?</Text>
                        <TouchableOpacity 
                            style={[styles.toggleBtn, formData.isFeatured && styles.toggleBtnActive]}
                            onPress={() => setFormData({...formData, isFeatured: !formData.isFeatured})}
                        >
                            <Text style={[styles.toggleBtnText, formData.isFeatured && styles.toggleBtnTextActive]}>
                                {formData.isFeatured ? 'Featured' : 'Regular'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.inputLabel}>Start Time</Text>
                        <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowStartTimePicker(true)}>
                            <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                            <Text style={styles.dateTimeText}>
                                {formData.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.inputLabel}>End Time</Text>
                        <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowEndTimePicker(true)}>
                            <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                            <Text style={styles.dateTimeText}>
                                {formData.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.inputLabel}>Location</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="e.g. Main Auditorium"
                    value={formData.location}
                    onChangeText={(text) => setFormData({...formData, location: text})}
                />

                <Text style={styles.inputLabel}>Cover Image</Text>
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
                            <Text style={styles.imagePlaceholderText}>Upload Preview Image</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <Text style={styles.inputLabel}>Event Video (Optional)</Text>
                <TouchableOpacity 
                    style={[styles.imagePickerBtn, { height: 80, borderStyle: 'solid' }]} 
                    onPress={pickVideo}
                >
                    {selectedVideo ? (
                        <View style={styles.videoSelectedRow}>
                            <Ionicons name="videocam" size={24} color={theme.colors.primary} />
                            <Text style={styles.videoSelectedText} numberOfLines={1}>Video Selected</Text>
                            <TouchableOpacity onPress={() => setSelectedVideo(null)}>
                                <Ionicons name="close-circle" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="videocam-outline" size={24} color="#9CA3AF" />
                                <Text style={[styles.imagePlaceholderText, { marginTop: 0, marginLeft: 8 }]}>Upload Promo Video</Text>
                            </View>
                        </View>
                    )}
                </TouchableOpacity>

                <Text style={styles.inputLabel}>Description</Text>
                <TextInput 
                    style={[styles.input, styles.textArea]} 
                    placeholder="Tell students about the event... (Max 250 characters)"
                    multiline
                    numberOfLines={4}
                    maxLength={250}
                    value={formData.description}
                    onChangeText={(text) => setFormData({...formData, description: text})}
                />
                <Text style={styles.charCountText}>{formData.description.length}/250 characters</Text>

                <TouchableOpacity style={styles.submitBtn} onPress={handleAddEvent} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>{isEditing ? 'Update Event' : 'Create Event'}</Text>}
                </TouchableOpacity>

                {/* Apple Style Date Modal Fix */}
                {Platform.OS === 'ios' && (
                    <Modal visible={showDatePicker || showStartTimePicker || showEndTimePicker} transparent animationType="fade">
                        <View style={styles.modalBg}>
                            <View style={styles.pickerModalContent}>
                                <View style={styles.spinnerWrapper}>
                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={formData.date}
                                            mode="date"
                                            display="inline"
                                            style={{ width: '100%' }}
                                            textColor="#000000"
                                            themeVariant="light"
                                            minimumDate={new Date()}
                                            onChange={(event, date) => { if(date) setFormData({...formData, date}); }}
                                        />
                                    )}
                                    {showStartTimePicker && (
                                        <DateTimePicker
                                            value={formData.startTime}
                                            mode="time"
                                            display="spinner"
                                            style={{ height: 200, width: '100%' }}
                                            textColor="#000000"
                                            themeVariant="light"
                                            onChange={(event, date) => { if(date) setFormData({...formData, startTime: date}); }}
                                        />
                                    )}
                                    {showEndTimePicker && (
                                        <DateTimePicker
                                            value={formData.endTime}
                                            mode="time"
                                            display="spinner"
                                            style={{ height: 200, width: '100%' }}
                                            textColor="#000000"
                                            themeVariant="light"
                                            onChange={(event, date) => { if(date) setFormData({...formData, endTime: date}); }}
                                        />
                                    )}
                                </View>
                                <TouchableOpacity style={styles.closePickerBtn} onPress={() => {
                                    setShowDatePicker(false);
                                    setShowStartTimePicker(false);
                                    setShowEndTimePicker(false);
                                }}>
                                    <Text style={styles.closePickerText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                )}

                {/* Android Pickers */}
                {Platform.OS === 'android' && showDatePicker && (
                    <DateTimePicker
                        value={formData.date}
                        mode="date"
                        display="default"
                        minimumDate={new Date()}
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) setFormData({...formData, date: selectedDate});
                        }}
                    />
                )}
                {Platform.OS === 'android' && showStartTimePicker && (
                    <DateTimePicker
                        value={formData.startTime}
                        mode="time"
                        display="clock"
                        onChange={(event, selectedDate) => {
                            setShowStartTimePicker(false);
                            if (selectedDate) setFormData({...formData, startTime: selectedDate});
                        }}
                    />
                )}
                {Platform.OS === 'android' && showEndTimePicker && (
                    <DateTimePicker
                        value={formData.endTime}
                        mode="time"
                        display="clock"
                        onChange={(event, selectedDate) => {
                            setShowEndTimePicker(false);
                            if (selectedDate) setFormData({...formData, endTime: selectedDate});
                        }}
                    />
                )}
                <View style={{ height: 100 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );

    const renderManageTab = () => {
        const filteredEvents = events.filter(e => 
            e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.location.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
            <ScrollView style={styles.manageContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.searchWrapper}>
                    <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search events by title, category..."
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

                {isLoading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
                ) : (
                    filteredEvents.length > 0 ? (
                        filteredEvents.map(event => {
                            const getCatColor = (cat) => {
                                switch(cat) {
                                    case 'Social': return '#6366F1';
                                    case 'Academic': return '#F59E0B';
                                    case 'Sports': return '#10B981';
                                    case 'Workshops': return '#EC4899';
                                    default: return theme.colors.primary;
                                }
                            };
                            const catColor = getCatColor(event.category);

                            return (
                                <TouchableOpacity key={event._id} style={styles.modernCard} onPress={() => prepareEdit(event)}>
                                    <View style={styles.cardHeaderArea}>
                                        <Image source={{ uri: getImageUrl(event.image) }} style={styles.modernThumb} />
                                        {event.isFeatured && (
                                            <View style={styles.featuredTag}>
                                                <Ionicons name="sparkles" size={14} color="#FFF" />
                                                <Text style={styles.featuredTagText}>FEATURED</Text>
                                            </View>
                                        )}
                                    </View>
                                    
                                    <View style={styles.cardInfoBody}>
                                        <View style={styles.topRow}>
                                            <View style={[styles.modernCatBadge, { backgroundColor: catColor + '20' }]}>
                                                <Text style={[styles.modernCatText, { color: catColor }]}>{event.category}</Text>
                                            </View>
                                            <View style={styles.modernActions}>
                                                <TouchableOpacity style={styles.miniActionBtn} onPress={() => prepareEdit(event)}>
                                                    <Ionicons name="create-outline" size={18} color="#4B5563" />
                                                </TouchableOpacity>
                                                <TouchableOpacity style={styles.miniActionBtn} onPress={() => handleDeleteEvent(event._id)}>
                                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <Text style={styles.modernTitle} numberOfLines={1}>{event.title}</Text>
                                        
                                        <View style={styles.detailsGrid}>
                                            <View style={styles.detailItem}>
                                                <Ionicons name="calendar" size={12} color="#9CA3AF" />
                                                <Text style={styles.detailText}>{event.date}</Text>
                                            </View>
                                            <View style={[styles.detailItem, { marginLeft: 12 }]}>
                                                <Ionicons name="location" size={12} color="#9CA3AF" />
                                                <Text style={styles.detailText} numberOfLines={1}>{event.location}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        <View style={styles.emptySearchState}>
                            <Ionicons name="search-outline" size={48} color="#E5E7EB" />
                            <Text style={styles.emptySearchText}>No events match your search</Text>
                        </View>
                    )
                )}
                <View style={{ height: 100 }} />
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.managementHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1E1B4B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Events Management</Text>
            </View>

            {/* Premium Toggle Switch */}
            <View style={styles.toggleWrapper}>
                <View style={styles.toggleBackground}>
                    <TouchableOpacity 
                        style={[styles.toggleOption, activeTab === 'add' && styles.toggleOptionActive]} 
                        onPress={() => {
                            setActiveTab('add');
                            if (!isEditing) {
                                setFormData({
                                    title: '',
                                    category: 'Social',
                                    date: new Date(),
                                    startTime: new Date(),
                                    endTime: new Date(),
                                    location: '',
                                    description: '',
                                    isFeatured: false,
                                    baseInterestedCount: 0
                                });
                                setSelectedImage(null);
                                setSelectedVideo(null);
                            }
                        }}
                    >
                        <Text style={[styles.toggleText, activeTab === 'add' && styles.toggleTextActive]}>
                            {isEditing ? 'Edit Item' : 'Add Event'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.toggleOption, activeTab === 'manage' && styles.toggleOptionActive]} 
                        onPress={() => setActiveTab('manage')}
                    >
                        <Text style={[styles.toggleText, activeTab === 'manage' && styles.toggleTextActive]}>Manage Items</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {activeTab === 'add' ? renderAddTab() : renderManageTab()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    managementHeader: { paddingTop: 60, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backBtn: { padding: 4, marginRight: 12 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E1B4B' },
    toggleWrapper: { paddingHorizontal: 24, marginBottom: 24 },
    toggleBackground: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 14, padding: 4 },
    toggleOption: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
    toggleOptionActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    toggleText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
    toggleTextActive: { color: theme.colors.primary },
    formContainer: { paddingHorizontal: 24 },
    inputLabel: { fontSize: 14, fontWeight: '700', color: '#4B5563', marginBottom: 8, marginTop: 16 },
    input: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, fontSize: 15, color: '#1E1B4B', borderWidth: 1, borderColor: '#E5E7EB' },
    textArea: { height: 100, textAlignVertical: 'top' },
    categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB' },
    catPillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    catPillText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
    catPillTextActive: { color: '#FFF' },
    row: { flexDirection: 'row' },
    dateTimeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
    dateTimeText: { marginLeft: 10, fontSize: 14, color: '#1E1B4B', fontWeight: '500' },
    toggleBtn: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
    toggleBtnActive: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
    toggleBtnText: { fontWeight: '700', color: '#6B7280' },
    toggleBtnTextActive: { color: '#10B981' },
    submitBtn: { backgroundColor: theme.colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 32, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    manageContainer: { paddingHorizontal: 24 },
    eventItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    itemThumb: { width: 50, height: 50, borderRadius: 10 },
    itemInfo: { flex: 1, marginLeft: 12 },
    itemTitle: { fontSize: 15, fontWeight: '700', color: '#1E1B4B' },
    itemSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    itemActions: { flexDirection: 'row' },
    actionIcon: { padding: 6, marginLeft: 4 },
    imagePickerBtn: {
        backgroundColor: '#FFF',
        height: 180,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center'
    },
    imagePreview: { width: '100%', height: '100%' },
    imagePlaceholder: { alignItems: 'center' },
    imagePlaceholderText: { color: '#9CA3AF', marginTop: 8, fontWeight: '600' },
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    pickerModalContent: { 
        backgroundColor: '#FFF', 
        borderRadius: 24, 
        padding: 20, 
        width: '95%', 
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10
    },
    spinnerWrapper: {
        minHeight: 200,
        width: '100%',
        justifyContent: 'center',
    },
    closePickerBtn: { 
        marginTop: 20, 
        backgroundColor: theme.colors.primary, 
        paddingHorizontal: 40, 
        paddingVertical: 14, 
        borderRadius: 16,
        width: '100%',
        alignItems: 'center'
    },
    closePickerText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
    eventCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 12,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    thumbContainer: { position: 'relative' },
    itemThumb: { width: 70, height: 70, borderRadius: 15 },
    catBadge: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    catBadgeText: { color: '#FFF', fontSize: 8, fontWeight: '800' },
    titleRow: { flexDirection: 'row', alignItems: 'center' },
    featuredBadge: { marginLeft: 6 },
    locRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    locText: { fontSize: 11, color: '#6B7280', marginLeft: 4 },
    cardActions: { flexDirection: 'row' },
    actionBtn: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#1F2937',
    },
    emptySearchState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptySearchText: {
        color: '#9CA3AF',
        marginTop: 12,
        fontSize: 15,
        fontWeight: '500',
    },
    modernCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 3,
    },
    cardHeaderArea: {
        height: 120,
        width: '100%',
        position: 'relative',
    },
    modernThumb: {
        width: '100%',
        height: '100%',
    },
    featuredTag: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(99, 102, 241, 0.9)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    featuredTagText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    cardInfoBody: {
        padding: 16,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modernCatBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    modernCatText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    modernActions: {
        flexDirection: 'row',
    },
    miniActionBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    modernTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    detailsGrid: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
        fontWeight: '500',
    },
    videoSelectedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        width: '100%',
    },
    videoSelectedText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#1E1B4B',
        fontWeight: '600',
    },
    charCountText: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'right',
        marginTop: 4,
        fontWeight: '600',
    },
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
    }
});

export default AdminEventManagementScreen;
