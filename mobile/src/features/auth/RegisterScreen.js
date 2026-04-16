import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { AuthContext } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
    const { register, isLoading } = useContext(AuthContext);

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [studentId, setStudentId] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [agree, setAgree] = useState(false);
    const [errors, setErrors] = useState({});

    const handleBlur = (field) => {
        let newErrors = { ...errors };

        if (field === 'fullName') {
            if (!fullName) newErrors.fullName = 'Full Name is required';
            else delete newErrors.fullName;
        }
        if (field === 'email') {
            if (!email) newErrors.email = 'Email is required';
            else if (!validateEmail(email)) newErrors.email = 'Enter a valid email address';
            else delete newErrors.email;
        }
        if (field === 'studentId') {
            if (!studentId) newErrors.studentId = 'Student ID is required';
            else delete newErrors.studentId;
        }
        if (field === 'password') {
            if (!password) newErrors.password = 'Password is required';
            else if (!validatePassword(password)) newErrors.password = 'Min 6 chars, 1 letter, 1 number';
            else delete newErrors.password;
            
            if (confirm && password && confirm !== password) newErrors.confirm = 'Passwords do not match';
            else if (confirm && password && confirm === password) delete newErrors.confirm;
        }
        if (field === 'confirm') {
            if (!confirm) newErrors.confirm = 'Please confirm password';
            else if (password !== confirm) newErrors.confirm = 'Passwords do not match';
            else delete newErrors.confirm;
        }

        setErrors(newErrors);
    };

    const validateEmail = (emailText) => {
        const re = /\S+@\S+\.\S+/;
        return re.test(emailText);
    };

    const validatePassword = (passText) => {
        const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
        return re.test(passText);
    };

    const handleRegister = async () => {
        if(!fullName || !email || !studentId || !password) {
            alert("Please fill all fields");
            return;
        }
        if (!validateEmail(email)) {
            alert("Please enter a valid email address (e.g. name@domain.com)");
            return;
        }
        if (!validatePassword(password)) {
            alert("Password must be at least 6 characters long and contain at least one letter and one number.");
            return;
        }
        if (password !== confirm) {
            alert("Passwords do not match");
            return;
        }
        if (!agree) {
            alert("Please agree to the terms and conditions");
            return;
        }

        try {
            const data = await register(fullName, email, studentId, password);

            if (data.status === 'success') {
                navigation.navigate('Verification', { email });
            }
        } catch (error) {
            alert(error.message || "Registration Failed or User Exists.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.logoText}>ScholarPulse</Text>
                </View>

                <View style={styles.tagContainer}>
                    <Text style={styles.tagText}>REGISTRATION</Text>
                </View>

                <Text style={styles.title}>Create Your Account</Text>
                <Text style={styles.subtitle}>Enter your credentials to access the academic pulse.</Text>

                <View style={styles.formContainer}>
                    <Text style={styles.label}>FULL NAME</Text>
                    <View style={[styles.inputContainer, errors.fullName && styles.inputErrorBorder]}>
                        <TextInput style={styles.input} placeholder="e.g. Dr. Alexander Wright" placeholderTextColor={theme.colors.textSub} value={fullName} onChangeText={setFullName} onBlur={() => handleBlur('fullName')} />
                    </View>
                    {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

                    <Text style={[styles.label, { marginTop: 16 }]}>GMAIL</Text>
                    <View style={[styles.inputContainer, errors.email && styles.inputErrorBorder]}>
                        <TextInput style={styles.input} placeholder="e.g. alex.wright@gmail.com" placeholderTextColor={theme.colors.textSub} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" onBlur={() => handleBlur('email')} />
                    </View>
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                    <Text style={[styles.label, { marginTop: 16 }]}>STUDENT ID</Text>
                    <View style={[styles.inputContainer, errors.studentId && styles.inputErrorBorder]}>
                        <TextInput style={styles.input} placeholder="e.g. STU-882910" placeholderTextColor={theme.colors.textSub} value={studentId} onChangeText={setStudentId} onBlur={() => handleBlur('studentId')} />
                    </View>
                    {errors.studentId && <Text style={styles.errorText}>{errors.studentId}</Text>}

                    <Text style={[styles.label, { marginTop: 16 }]}>PASSWORD</Text>
                    <View style={[styles.inputContainer, errors.password && styles.inputErrorBorder, { flexDirection: 'row', alignItems: 'center' }]}>
                        <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={theme.colors.textSub} secureTextEntry={!showPassword} value={password} onChangeText={setPassword} onBlur={() => handleBlur('password')} />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={theme.colors.textSub} />
                        </TouchableOpacity>
                    </View>
                    {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                    <Text style={[styles.label, { marginTop: 16 }]}>CONFIRM</Text>
                    <View style={[styles.inputContainer, errors.confirm && styles.inputErrorBorder, { flexDirection: 'row', alignItems: 'center' }]}>
                        <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={theme.colors.textSub} secureTextEntry={!showConfirm} value={confirm} onChangeText={setConfirm} onBlur={() => handleBlur('confirm')} />
                        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                            <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color={theme.colors.textSub} />
                        </TouchableOpacity>
                    </View>
                    {errors.confirm && <Text style={styles.errorText}>{errors.confirm}</Text>}

                    <TouchableOpacity style={styles.termsContainer} onPress={() => setAgree(!agree)}>
                        <View style={[styles.checkbox, agree && { backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
                            {agree && <Ionicons name="checkmark" size={14} color={theme.colors.white} />}
                        </View>
                        <Text style={styles.termsText}>I agree to the <Text style={styles.link}>Academic Integrity Policy</Text> and <Text style={styles.link}>Terms of Service.</Text></Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.mainBtn} onPress={handleRegister} disabled={isLoading}>
                        <Text style={styles.mainBtnText}>{isLoading ? 'Creating...' : 'Create Account →'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.footerLink}>Login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.white },
    contentContainer: { padding: 24, paddingBottom: 60 },
    header: { marginBottom: 24 },
    logoText: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary },
    tagContainer: { backgroundColor: theme.colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, alignSelf: 'flex-start', marginBottom: 16 },
    tagText: { color: theme.colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    title: { fontSize: 32, fontWeight: '800', color: theme.colors.textMain, marginBottom: 8 },
    subtitle: { fontSize: 16, color: theme.colors.textSub, marginBottom: 24 },
    formContainer: { },
    label: { fontSize: 11, fontWeight: '700', color: theme.colors.textMain, marginBottom: 8, letterSpacing: 0.5 },
    inputContainer: { backgroundColor: theme.colors.inputBg, borderRadius: 12, height: 50, paddingHorizontal: 16, justifyContent: 'center' },
    input: { flex: 1, color: theme.colors.textMain, fontSize: 14 },
    inputErrorBorder: { borderColor: '#ff4d4f', borderWidth: 1 },
    errorText: { color: '#ff4d4f', fontSize: 11, marginTop: 6, marginLeft: 4, fontWeight: '600' },
    termsContainer: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 24, marginBottom: 24 },
    checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight, marginRight: 12, marginTop: 2 },
    termsText: { flex: 1, fontSize: 13, color: theme.colors.textSub, lineHeight: 20 },
    link: { color: theme.colors.primary, fontWeight: '500' },
    mainBtn: { backgroundColor: theme.colors.primary, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    mainBtnText: { color: theme.colors.white, fontSize: 16, fontWeight: '700' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
    footerText: { color: theme.colors.textSub, fontSize: 14 },
    footerLink: { color: theme.colors.primary, fontSize: 14, fontWeight: '700' }
});
