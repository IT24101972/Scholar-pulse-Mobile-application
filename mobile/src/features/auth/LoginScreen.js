import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { AuthContext } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
    const { login, isLoading } = useContext(AuthContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');

    const handleBlur = (field) => {
        let newErrors = { ...errors };
        if (field === 'email') {
            if (!email) newErrors.email = 'Email / Student ID is required';
            else delete newErrors.email;
        }
        if (field === 'password') {
            if (!password) newErrors.password = 'Password is required';
            else delete newErrors.password;
        }
        setErrors(newErrors);
        setServerError('');
    };

    const handleLogin = async () => {
        if(!email || !password) {
            handleBlur('email');
            handleBlur('password');
            return;
        }
        setServerError('');
        
        try {
            const data = await login(email, password);

            if (data.status === 'success') {
                if (data.data.role === 'admin') {
                    alert(`Welcome Admin! (${data.data.fullName})`);
                } else if (!data.data.isVerified) {
                    // if not verified yet, send to verification screen
                    navigation.navigate('Verification', { email });
                }
            }
        } catch (error) {
            setServerError(error.message || "Invalid credentials or Network Error.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.content}>
                
                <View style={styles.header}>
                    {/* Placeholder for Logo */}
                    <Text style={styles.logoText}>ScholarPulse</Text>
                </View>

                <Text style={styles.title}>Welcome Back,{"\n"}<Text style={styles.titleHighlight}>Scholar.</Text></Text>
                <Text style={styles.subtitle}>Access your academic pulse and stay ahead of the curve.</Text>

                <View style={styles.formContainer}>
                    <Text style={styles.label}>Campus Email / ID</Text>
                    <View style={[styles.inputContainer, errors.email && styles.inputErrorBorder]}>
                        <TextInput 
                            style={styles.input}
                            placeholder="e.g. j.smith@university.edu"
                            placeholderTextColor={theme.colors.textSub}
                            value={email}
                            onChangeText={(text) => { setEmail(text); setServerError(''); }}
                            autoCapitalize="none"
                            onBlur={() => handleBlur('email')}
                        />
                    </View>
                    {errors.email && <Text style={styles.fieldErrorText}>{errors.email}</Text>}

                    <View style={styles.labelRow}>
                        <Text style={styles.label}>Password</Text>
                        <TouchableOpacity>
                            <Text style={styles.forgotText}>Forgot Password?</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.inputContainer, errors.password && styles.inputErrorBorder, { flexDirection: 'row', alignItems: 'center' }]}>
                        <TextInput 
                            style={styles.input}
                            placeholder="••••••••••••"
                            placeholderTextColor={theme.colors.textSub}
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={(text) => { setPassword(text); setServerError(''); }}
                            onBlur={() => handleBlur('password')}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={theme.colors.textSub} />
                        </TouchableOpacity>
                    </View>
                    {errors.password && <Text style={styles.fieldErrorText}>{errors.password}</Text>}

                    {serverError ? <Text style={styles.serverErrorText}>{serverError}</Text> : null}

                    <TouchableOpacity style={styles.mainBtn} onPress={handleLogin} disabled={isLoading}>
                        <Text style={styles.mainBtnText}>{isLoading ? 'Logging in...' : 'Login to Portal'}</Text>
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>OR ACCESS AS</Text>
                        <View style={styles.divider} />
                    </View>

                    <TouchableOpacity style={styles.adminBtn}>
                        <Text style={styles.adminBtnText}>Admin Portal Access</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>New to Scholar Pulse? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.footerLink}>Register Account</Text>
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
    header: { alignItems: 'flex-start', marginBottom: 40 },
    logoText: { fontSize: 24, fontWeight: 'bold', color: theme.colors.primary },
    title: { fontSize: 40, fontWeight: '800', color: theme.colors.textMain, marginBottom: 12 },
    titleHighlight: { color: theme.colors.primary },
    subtitle: { fontSize: 16, color: theme.colors.textSub, marginBottom: 32, lineHeight: 24 },
    formContainer: { backgroundColor: theme.colors.white, borderRadius: 16, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 2 },
    label: { fontSize: 14, fontWeight: '600', color: theme.colors.textMain, marginBottom: 8 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, marginTop: 16 },
    forgotText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
    inputContainer: { backgroundColor: theme.colors.inputBg, borderRadius: 12, height: 50, paddingHorizontal: 16, justifyContent: 'center' },
    input: { flex: 1, color: theme.colors.textMain, fontSize: 14 },
    inputErrorBorder: { borderColor: '#ff4d4f', borderWidth: 1 },
    fieldErrorText: { color: '#ff4d4f', fontSize: 11, marginTop: 6, marginLeft: 4, fontWeight: '600' },
    serverErrorText: { color: '#ff4d4f', fontSize: 13, marginTop: 16, textAlign: 'center', fontWeight: '700' },
    mainBtn: { backgroundColor: theme.colors.primary, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 24, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    mainBtnText: { color: theme.colors.white, fontSize: 16, fontWeight: '700' },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
    divider: { flex: 1, height: 1, backgroundColor: theme.colors.border },
    dividerText: { marginHorizontal: 12, fontSize: 12, color: theme.colors.textSub, fontWeight: '600' },
    adminBtn: { backgroundColor: theme.colors.background, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    adminBtnText: { color: theme.colors.textMain, fontSize: 14, fontWeight: '600' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
    footerText: { color: theme.colors.textSub, fontSize: 14 },
    footerLink: { color: theme.colors.primary, fontSize: 14, fontWeight: '600' }
});
