import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Keyboard } from 'react-native';
import { theme } from '../../theme/theme';
import { BASE_URL } from '../../config/api';

export default function VerificationScreen({ route, navigation }) {
    const { email } = route.params || {};
    const [code, setCode] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef([]);

    const handleVerify = async () => {
        const otp = code.join('');
        if (otp.length < 4) {
             return alert("Please enter the 4 digit code.");
        }
        
        setLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });

            const data = await response.json();
            setLoading(false);

            if (data.status === 'success') {
                alert("Success! Account verified.");
                navigation.navigate('Login'); // Once verified, go to login
            } else {
                alert(data.message || "Invalid Verification Code.");
            }
        } catch (error) {
            setLoading(false);
            alert("Network Error");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>← Verification</Text>
                </TouchableOpacity>

                <View style={styles.tagContainer}>
                    <Text style={styles.tagText}>IDENTITY CHECK</Text>
                </View>

                <Text style={styles.title}>Secure{"\n"}<Text style={styles.titleHighlight}>Access.</Text></Text>
                <Text style={styles.subtitle}>Enter the 4-digit verification code sent to your academic email.</Text>

                <View style={styles.codeContainer}>
                    {code.map((digit, index) => (
                        <View key={index} style={styles.inputBox}>
                            <TextInput 
                                ref={(el) => inputRefs.current[index] = el}
                                style={styles.input}
                                maxLength={1}
                                keyboardType="number-pad"
                                value={digit}
                                onChangeText={(val) => {
                                    let newCode = [...code];
                                    newCode[index] = val;
                                    setCode(newCode);

                                    // Auto-advance to next input
                                    if (val && index < 3) {
                                        inputRefs.current[index + 1].focus();
                                    }
                                    
                                    // Dismiss keyboard automatically when 4th digit is entered
                                    if (val && index === 3) {
                                        Keyboard.dismiss();
                                    }
                                }}
                                onKeyPress={({ nativeEvent }) => {
                                    // Auto-focus back on Backspace if empty
                                    if (nativeEvent.key === 'Backspace' && !digit && index > 0) {
                                        inputRefs.current[index - 1].focus();
                                    }
                                }}
                            />
                        </View>
                    ))}
                </View>

                <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Didn't receive it? </Text>
                    <TouchableOpacity>
                        <Text style={styles.resendLink}>Resend Code</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.mainBtn} onPress={handleVerify} disabled={loading}>
                    <Text style={styles.mainBtnText}>{loading ? 'Verifying...' : 'Verify & Register'}</Text>
                </TouchableOpacity>

                <View style={styles.alertBox}>
                    <Text style={styles.alertText}>✓ VERIFIED ACCOUNTS GET FULL PULSE ACCESS</Text>
                </View>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { flex: 1, padding: 24, justifyContent: 'center' },
    backBtn: { position: 'absolute', top: 20, left: 24 },
    backBtnText: { fontSize: 16, fontWeight: '600', color: theme.colors.textMain },
    tagContainer: { marginTop: 40, borderBottomWidth: 2, borderBottomColor: theme.colors.primary, alignSelf: 'flex-start', paddingBottom: 4, marginBottom: 24 },
    tagText: { color: theme.colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
    title: { fontSize: 48, fontWeight: '800', color: theme.colors.textMain, marginBottom: 8, lineHeight: 54 },
    titleHighlight: { color: theme.colors.primary },
    subtitle: { fontSize: 16, color: theme.colors.textSub, marginBottom: 40, lineHeight: 24, paddingRight: 40 },
    codeContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24, gap: 16 },
    inputBox: { width: 60, height: 70, backgroundColor: theme.colors.inputBg, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    input: { fontSize: 24, fontWeight: 'bold', color: theme.colors.textMain, textAlign: 'center' },
    resendContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 40 },
    resendText: { color: theme.colors.textSub, fontSize: 14 },
    resendLink: { color: theme.colors.primary, fontSize: 14, fontWeight: '700' },
    mainBtn: { backgroundColor: theme.colors.primary, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    mainBtnText: { color: theme.colors.white, fontSize: 16, fontWeight: '700' },
    alertBox: { marginTop: 24, alignSelf: 'center' },
    alertText: { color: theme.colors.textSub, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }
});
