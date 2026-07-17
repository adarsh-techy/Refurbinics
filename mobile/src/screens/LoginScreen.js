import { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/auth-slice';

export default function LoginScreen() {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit() {
    dispatch(login({ email: email.trim(), password }));
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-surface-950"
    >
      <View className="flex-1 justify-center px-6">
        <View className="mb-8 items-center">
          <Image
            source={require('../../assets/logo.png')}
            style={{ width: 208, height: 80 }}
            resizeMode="contain"
          />
          <Text className="mt-2 text-sm text-neutral-400">Technician Sign In</Text>
        </View>

        <View className="gap-4 rounded-2xl border border-blue-800/40 bg-blue-900/10 p-5">
          <View>
            <Text className="mb-1.5 text-sm font-medium text-neutral-200">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              className="rounded-md border border-blue-800/40 bg-surface-900 px-3.5 py-3 text-base text-neutral-100"
              placeholderTextColor="#6b7280"
            />
          </View>

          <View>
            <Text className="mb-1.5 text-sm font-medium text-neutral-200">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              className="rounded-md border border-blue-800/40 bg-surface-900 px-3.5 py-3 text-base text-neutral-100"
              placeholderTextColor="#6b7280"
            />
          </View>

          {error && <Text className="text-sm text-red-400">{error}</Text>}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={status === 'loading'}
            className="mt-1 items-center rounded-md bg-blue-600 py-3.5 disabled:opacity-50"
          >
            {status === 'loading' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
