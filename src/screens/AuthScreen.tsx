import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, Title } from 'react-native-paper';
import { supabase } from '../services/supabase';

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);

    async function handleAuth() {
        setLoading(true);
        const { error } = isLogin
            ? await supabase.auth.signInWithPassword({ email, password })
            : await supabase.auth.signUp({ email, password });

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            if (!isLogin) Alert.alert('Success', 'Please check your email for verification!');
        }
        setLoading(false);
    }

    return (
        <View style={styles.container}>
            <Title style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Title>
            <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                style={styles.input}
            />
            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
            />
            <Button mode="contained" onPress={handleAuth} loading={loading} style={styles.button}>
                {isLogin ? 'Login' : 'Sign Up'}
            </Button>
            <Button onPress={() => setIsLogin(!isLogin)} style={styles.textButton}>
                {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        marginBottom: 10,
    },
    button: {
        marginTop: 10,
    },
    textButton: {
        marginTop: 10,
    },
});
