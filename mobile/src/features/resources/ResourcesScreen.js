import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Platform, SafeAreaView, Modal, Animated, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import { theme } from '../../theme/theme';
import { AuthContext } from '../../context/AuthContext';
import { BASE_URL } from '../../config/api';

const CATEGORIES = ['My Files', 'Faculty Shared'];

export default function ResourcesScreen() {
    const { token, currentUser } = useContext(AuthContext);
    const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'manager'
    const [activeTab, setActiveTab] = useState('My Files');
    const [resources, setResources] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [managerFilter, setManagerFilter] = useState(null); // null | 'saved'
    const [menuVisible, setMenuVisible] = useState(false);
    const [plusMenuVisible, setPlusMenuVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isPicking, setIsPicking] = useState(false);
    const [renameModalVisible, setRenameModalVisible] = useState(false);
    const [tempName, setTempName] = useState('');
    const [currentFolder, setCurrentFolder] = useState(null); // null means root
    const [navigationStack, setNavigationStack] = useState([]); // [{id, name}]
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (token) {
            fetchResources();
        }
    }, [token, currentFolder, managerFilter, activeTab]);

    const fetchResources = async () => {
        setIsLoading(true);
        try {
            let url = '';
            if (managerFilter === 'saved') {
                url = `${BASE_URL}/resources/saved`;
            } else if (activeTab === 'Faculty Shared') {
                url = `${BASE_URL}/resources/public`;
            } else {
                const endpoint = managerFilter === 'recent' ? '/resources/recent' : '/resources';
                url = `${BASE_URL}${endpoint}${currentFolder ? `?parent=${currentFolder}` : ''}`;
            }
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResources(res.data.data);
        } catch (error) {
            console.error('Error fetching resources:', error);
            Alert.alert('Error', 'Failed to load resources.');
        } finally {
            setIsLoading(false);
        }
    };

    const openItemMenu = (item) => {
        setSelectedItem(item);
        setMenuVisible(true);
    };

    const openManager = (filter = null) => {
        setManagerFilter(filter);
        if (filter === 'recent' || filter === 'saved') {
            setNavigationStack([]);
            setCurrentFolder(null);
        }
        setCurrentView('manager');
    };

    const openFolder = (folder) => {
        setNavigationStack([...navigationStack, { id: folder._id, name: folder.name }]);
        setCurrentFolder(folder._id);
    };

    const goBack = () => {
        if (navigationStack.length === 0) {
            setCurrentView('dashboard');
            return;
        }
        const newStack = [...navigationStack];
        newStack.pop();
        setNavigationStack(newStack);
        const prevFolder = newStack.length > 0 ? newStack[newStack.length - 1].id : null;
        setCurrentFolder(prevFolder);
    };

    const toggleSave = async (id) => {
        try {
            const res = await axios.post(`${BASE_URL}/resources/${id}/save`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state
            setResources(resources.map(r => r._id === id ? res.data.data : r));
        } catch (error) {
            console.error('Error saving resource:', error);
        }
    };

    const handleCreateFolder = async () => {
        // Simplified for dummy UI but with real API
        setPlusMenuVisible(false);
        try {
            const res = await axios.post(`${BASE_URL}/resources`, {
                name: 'New Folder',
                type: 'folder',
                parent: currentFolder
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResources([res.data.data, ...resources]);
            Alert.alert('Success', 'Folder created successfully!');
        } catch (error) {
            console.error('Error creating folder:', error);
            Alert.alert('Error', 'Failed to create folder.');
        }
    };

    const handleUploadFile = async () => {
        console.log('Upload button pressed. current isPicking:', isPicking);
        if (isPicking) return;
        setIsPicking(true);
        // Let's NOT close the modal immediately to see if it helps

        try {
            console.log('Calling DocumentPicker directly...');
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
            });

            console.log('DocumentPicker returned:', result);
            setPlusMenuVisible(false); // Close it after selection

            if (result.canceled) {
                console.log('Picker canceled');
                return;
            }

            const file = result.assets[0];
            setIsLoading(true);

            const formData = new FormData();
            if (Platform.OS === 'web' && file.file) {
                // On web, Expo DocumentPicker provides the native File object
                formData.append('file', file.file);
            } else {
                // For native (iOS/Android)
                formData.append('file', {
                    uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
                    name: file.name,
                    type: file.mimeType || 'application/octet-stream',
                });
            }

            if (currentFolder) {
                formData.append('parent', currentFolder);
            }

            console.log('Uploading to:', `${BASE_URL}/resources`);
            const res = await axios.post(`${BASE_URL}/resources`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                }
            });

            console.log('Upload success:', res.data);
            setResources([res.data.data, ...resources]);
            Alert.alert('Success', 'File uploaded successfully!');
        } catch (error) {
            console.error('Error in handleUploadFile:', error);
            setPlusMenuVisible(false);
            Alert.alert('Error', 'Failed to upload file.');
        } finally {
            setIsLoading(false);
            setIsPicking(false);
        }
    };

    const handleOpenFile = async (fileUrl) => {
        if (!fileUrl) return;

        try {
            // Construct full URL (Strip '/api' from BASE_URL and append the file's relative URL)
            const serverUrl = BASE_URL.split('/api')[0];
            const fullUrl = `${serverUrl}${fileUrl}`;

            console.log('Opening file:', fullUrl);
            await WebBrowser.openBrowserAsync(fullUrl);
        } catch (error) {
            console.error('Error opening file:', error);
            Alert.alert('Error', 'Could not open this file.');
        }
    };

    const handleDownload = async () => {
        setMenuVisible(false);
        if (!selectedItem || !selectedItem.url) return;

        try {
            const serverUrl = BASE_URL.split('/api')[0];
            const fullUrl = `${serverUrl}${selectedItem.url}`;
            
            if (Platform.OS === 'web') {
                const link = document.createElement('a');
                link.href = fullUrl;
                link.setAttribute('download', selectedItem.name || 'download');
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                await WebBrowser.openBrowserAsync(fullUrl);
            }
        } catch (error) {
            console.error('Error downloading file:', error);
            Alert.alert('Error', 'Could not download the file.');
        }
    };

    const handleRenameItem = async () => {
        if (!tempName.trim()) return;
        setRenameModalVisible(false);
        try {
            const res = await axios.patch(`${BASE_URL}/resources/${selectedItem._id}`, {
                name: tempName
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResources(resources.map(r => r._id === selectedItem._id ? res.data.data : r));
            Alert.alert('Success', 'Resource renamed!');
        } catch (error) {
            console.error('Error renaming item:', error);
        }
    };

    const handleDeleteItem = async (id) => {
        setMenuVisible(false);
        try {
            await axios.delete(`${BASE_URL}/resources/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResources(resources.filter(r => r._id !== id));
            Alert.alert('Success', 'Item deleted.');
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    const handleShareItem = async (id, isPublic) => {
        setMenuVisible(false);
        try {
            const res = await axios.patch(`${BASE_URL}/resources/${id}`, {
                isPublic: !isPublic
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResources(resources.map(r => r._id === id ? res.data.data : r));
            Alert.alert('Status Updated', isPublic ? 'Resource is now private.' : 'Resource is now shared publicly!');
        } catch (error) {
            console.error('Error sharing item:', error);
        }
    };

    const renderFileItem = (item, isSeamless = false, showSave = true) => {
        const isSaved = item.isSavedBy?.includes(currentUser?._id);
        const dateStr = new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        // Define Icon mapping
        const getFileIcon = (type) => {
            switch (type) {
                case 'folder': return { name: 'folder', bg: '#FFEDD5', color: '#D97706' };
                case 'pdf': return { name: 'document-text', bg: '#FEE2E2', color: theme.colors.primary };
                case 'image': return { name: 'image', bg: '#E0E7FF', color: theme.colors.primary };
                case 'doc': return { name: 'document', bg: '#FEF3C7', color: theme.colors.primary };
                default: return { name: 'document-outline', bg: '#F3F4F6', color: theme.colors.primary };
            }
        };

        const iconStyle = getFileIcon(item.type);

        return (
            <TouchableOpacity
                key={item._id}
                style={[styles.fileItem, isSeamless && styles.seamlessFileItem]}
                onPress={() => item.type === 'folder' ? openFolder(item) : handleOpenFile(item.url)}
            >
                <View style={[styles.fileIconBox, { backgroundColor: iconStyle.bg }]}>
                    <Ionicons name={iconStyle.name} size={22} color={iconStyle.color} />
                </View>
                <View style={styles.fileDetails}>
                    <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.fileSub}>{item.size}  •  {dateStr}</Text>
                </View>

                <View style={styles.itemActions}>
                    {showSave && (
                        <TouchableOpacity onPress={() => toggleSave(item._id)} style={styles.actionIcon}>
                            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={20} color={isSaved ? theme.colors.primary : theme.colors.textSub} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => openItemMenu(item)} style={styles.actionIcon}>
                        <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.textSub} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderDashboard = () => (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <Text style={styles.title}>Academic <Text style={styles.titleBlue}>Resources</Text></Text>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={theme.colors.textSub} style={styles.searchIcon} />
                <TextInput 
                    placeholder="Search files, folders..." 
                    style={styles.searchInput} 
                    placeholderTextColor={theme.colors.textSub} 
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{ paddingLeft: 24, paddingRight: 10 }}>
                {CATEGORIES.map(cat => (
                    <TouchableOpacity key={cat} onPress={() => setActiveTab(cat)} style={[styles.categoryPill, activeTab === cat && styles.categoryPillActive]}>
                        <Text style={[styles.categoryText, activeTab === cat && styles.categoryTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {activeTab !== 'Faculty Shared' && (
                <View style={styles.cardContainer}>
                    <TouchableOpacity style={[styles.serviceCard, styles.examPackCard]} onPress={() => openManager(null)}>
                        <View style={styles.cardIconCircle}>
                            <Ionicons name="folder" size={24} color="#D97706" />
                        </View>
                        <Text style={styles.cardLabel}>My resources</Text>
                        <Text style={styles.cardCount}>{resources.filter(r => r.type === 'folder').length} FOLDERS</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.serviceCard, styles.savedCard]} onPress={() => openManager('saved')}>
                        <View style={[styles.cardIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <Ionicons name="bookmark" size={24} color="#FFF" />
                        </View>
                        <Text style={[styles.cardLabel, { color: '#FFF' }]}>Saved</Text>
                        <Text style={[styles.cardCount, { color: 'rgba(255,255,255,0.8)' }]}>{resources.filter(r => r.isSavedBy?.includes(currentUser?._id)).length} ITEMS</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.recentHeader}>
                <Text style={styles.sectionTitle}>{activeTab === 'Faculty Shared' ? 'Faculty Shared Resources' : 'Recent Materials'}</Text>
                {activeTab !== 'Faculty Shared' && (
                    <TouchableOpacity onPress={() => openManager('recent')}><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
                )}
            </View>

            <View style={styles.listContainer}>
                {isLoading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                ) : (
                    resources
                        .filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .filter(r => searchQuery ? true : r.type !== 'folder') // If searching, show folders too
                        .slice(0, searchQuery ? undefined : (activeTab === 'Faculty Shared' ? 10 : 3)) // If searching, don't slice
                        .map(file => renderFileItem(file, false, true))
                )}
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );

    const renderFileManager = () => {
        let currentFolderName = 'My Files';
        if (managerFilter === 'recent') currentFolderName = 'Recent Materials';
        else if (managerFilter === 'saved') currentFolderName = 'Saved Items';
        else if (navigationStack.length > 0) currentFolderName = navigationStack[navigationStack.length - 1].name;
        
        return (
            <View style={styles.managerContainer}>
                <View style={styles.managerHeader}>
                    <TouchableOpacity onPress={goBack} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color="#1E1B4B" />
                    </TouchableOpacity>
                    <Text style={styles.managerTitle}>{currentFolderName}</Text>
                    <TouchableOpacity style={styles.searchHeaderIcon}>
                        <Ionicons name="search" size={24} color="#1E1B4B" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 10 }}>
                    <View style={styles.seamlessList}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                        ) : (
                            resources
                                .filter(r => {
                                    if (managerFilter === 'saved') return r.isSavedBy?.includes(currentUser?._id);
                                    if (managerFilter === 'recent') return r.type !== 'folder';
                                    return true;
                                })
                                .map(item => renderFileItem(item, true, true))
                        )}
                        {!isLoading && resources.filter(r => {
                            if (managerFilter === 'saved') return r.isSavedBy?.includes(currentUser?._id);
                            if (managerFilter === 'recent') return r.type !== 'folder';
                            return true;
                        }).length === 0 && (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="folder-open-outline" size={60} color="#E5E7EB" />
                                <Text style={styles.emptyText}>This folder is empty</Text>
                                <Text style={styles.emptySubText}>Tap the + button to add files</Text>
                            </View>
                        )}
                    </View>
                    <View style={{ height: 120 }} />
                </ScrollView>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {currentView === 'dashboard' ? renderDashboard() : renderFileManager()}

            {/* Floating Action Button */}
            <TouchableOpacity style={styles.fab} onPress={() => setPlusMenuVisible(true)}>
                <Ionicons name="add" size={30} color="#FFF" />
            </TouchableOpacity>

            {/* Item Options Menu Modal */}
            <Modal visible={menuVisible} transparent animationType="slide">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
                    <View style={styles.menuModal}>
                        <View style={styles.menuHandle} />
                        <Text style={styles.menuTitle}>{selectedItem?.name}</Text>

                        {/* Show sharing, rename, and delete only if the user is the author */}
                        {(typeof selectedItem?.author === 'object' ? selectedItem?.author?._id === currentUser?._id : selectedItem?.author === currentUser?._id) && (
                            <>
                                <TouchableOpacity style={styles.menuOption} onPress={() => handleShareItem(selectedItem?._id, selectedItem?.isPublic)}>
                                    <Ionicons name={selectedItem?.isPublic ? "eye-off-outline" : "share-social-outline"} size={22} color="#1E1B4B" />
                                    <Text style={styles.menuOptionText}>{selectedItem?.isPublic ? 'Make Private' : 'Share to Public'}</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity style={styles.menuOption} onPress={handleDownload}>
                            <Ionicons name="download-outline" size={22} color="#1E1B4B" />
                            <Text style={styles.menuOptionText}>Download</Text>
                        </TouchableOpacity>

                        {(typeof selectedItem?.author === 'object' ? selectedItem?.author?._id === currentUser?._id : selectedItem?.author === currentUser?._id) && (
                            <>
                                <TouchableOpacity style={styles.menuOption} onPress={() => {
                                    setMenuVisible(false);
                                    setTempName(selectedItem.name);
                                    setRenameModalVisible(true);
                                }}>
                                    <Ionicons name="create-outline" size={22} color="#1E1B4B" />
                                    <Text style={styles.menuOptionText}>Rename</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.menuOption, { borderBottomWidth: 0 }]} onPress={() => handleDeleteItem(selectedItem?._id)}>
                                    <Ionicons name="trash-outline" size={22} color={theme.colors.danger} />
                                    <Text style={[styles.menuOptionText, { color: theme.colors.danger }]}>Delete</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Rename Modal */}
            <Modal visible={renameModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.renameModal}>
                        <Text style={styles.renameTitle}>Rename Resource</Text>
                        <TextInput
                            style={styles.renameInput}
                            value={tempName}
                            onChangeText={setTempName}
                            autoFocus
                            placeholder="Enter new name"
                        />
                        <View style={styles.renameActions}>
                            <TouchableOpacity onPress={() => setRenameModalVisible(false)} style={styles.cancelBtn}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleRenameItem} style={styles.saveBtn}>
                                <Text style={styles.saveBtnText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Plus Button Action Menu */}
            <Modal visible={plusMenuVisible} transparent animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPlusMenuVisible(false)}>
                    <View style={styles.plusMenuContainer}>
                        <TouchableOpacity style={styles.plusOption} onPress={handleUploadFile}>
                            <View style={[styles.plusIconBg, { backgroundColor: '#EEF2FF' }]}>
                                <Ionicons name="document-outline" size={24} color={theme.colors.primary} />
                            </View>
                            <Text style={styles.plusOptionText}>Upload File</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.plusOption} onPress={handleCreateFolder}>
                            <View style={[styles.plusIconBg, { backgroundColor: '#FFF7ED' }]}>
                                <Ionicons name="folder-outline" size={24} color="#D97706" />
                            </View>
                            <Text style={styles.plusOptionText}>Create Folder</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FE' },
    scrollContent: { paddingTop: Platform.OS === 'ios' ? 60 : 80 },
    header: { paddingHorizontal: 24, marginBottom: 20 },
    title: { fontSize: 32, fontWeight: '800', color: '#1E1B4B', letterSpacing: -1 },
    titleBlue: { color: theme.colors.primary, fontWeight: '800' },
    searchContainer: { backgroundColor: '#F0F1FA', marginHorizontal: 24, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, marginBottom: 24 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 15, color: '#1E1B4B' },
    categoryScroll: { marginBottom: 24 },
    categoryPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: '#E5E7EB', marginRight: 10 },
    categoryPillActive: { backgroundColor: '#10B981' },
    categoryText: { fontSize: 13, fontWeight: '700', color: '#4B5563' },
    categoryTextActive: { color: '#FFF' },
    cardContainer: { flexDirection: 'row', paddingHorizontal: 24, gap: 16, marginBottom: 32 },
    serviceCard: { flex: 1, borderRadius: 18, padding: 20, height: 170, justifyContent: 'center' },
    examPackCard: { backgroundColor: '#FFF', borderLeftWidth: 5, borderLeftColor: '#FBBF24', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
    savedCard: { backgroundColor: theme.colors.primary },
    cardIconCircle: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    cardLabel: { fontSize: 17, fontWeight: '700', color: '#1E1B4B', marginBottom: 4 },
    cardCount: { fontSize: 12, fontWeight: '700', color: '#FFF', letterSpacing: 0.5 },
    examPackCardCount: { color: theme.colors.primary },
    recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 },
    sectionTitle: { fontSize: 19, fontWeight: '700', color: '#1E1B4B' },
    seeAll: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
    listContainer: { paddingHorizontal: 24 },
    fileItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 14, borderRadius: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8 },
    seamlessFileItem: { backgroundColor: 'transparent', paddingHorizontal: 0, borderRadius: 0, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)', shadowOpacity: 0, elevation: 0 },
    fileIconBox: { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    fileDetails: { flex: 1, marginLeft: 14 },
    fileName: { fontSize: 14, fontWeight: '600', color: '#1E1B4B', marginBottom: 2 },
    fileSub: { fontSize: 11, color: theme.colors.textSub },
    itemActions: { flexDirection: 'row' },
    actionIcon: { padding: 4, marginLeft: 4 },
    fab: { position: 'absolute', bottom: 100, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
    managerContainer: { flex: 1 },
    managerHeader: { height: 110, paddingTop: 50, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', backgroundColor: '#FFF' },
    backBtn: { padding: 4 },
    managerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#1E1B4B' },
    searchHeaderIcon: { padding: 4 },
    breadcrumbCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 20 },
    breadcrumbText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
    managerSectionTitle: { fontSize: 16, fontWeight: '700', color: '#6B7280', marginBottom: 12 },
    seamlessList: { marginBottom: 20 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    menuModal: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    menuHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    menuTitle: { fontSize: 16, fontWeight: '700', color: '#1E1B4B', marginBottom: 24, textAlign: 'center' },
    menuOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    menuOptionText: { fontSize: 15, fontWeight: '600', color: '#1E1B4B', marginLeft: 16 },
    plusMenuContainer: { position: 'absolute', bottom: 170, right: 24, backgroundColor: '#FFF', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 },
    plusOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 },
    plusIconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    plusOptionText: { fontSize: 14, fontWeight: '700', color: '#1E1B4B' },
    renameModal: { backgroundColor: '#FFF', width: '80%', padding: 24, borderRadius: 20, alignSelf: 'center', marginBottom: 'auto', marginTop: 'auto' },
    renameTitle: { fontSize: 18, fontWeight: '700', color: '#1E1B4B', marginBottom: 20 },
    renameInput: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, fontSize: 15, color: '#1E1B4B', marginBottom: 20 },
    renameActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
    cancelBtnText: { fontSize: 14, fontWeight: '700', color: theme.colors.textSub },
    saveBtn: { backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
    saveBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { fontSize: 18, fontWeight: '700', color: '#1E1B4B', marginTop: 16 },
    emptySubText: { fontSize: 14, color: theme.colors.textSub, marginTop: 8 }
});
