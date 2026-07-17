import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import apiClient from '../services/api-client';
import { logout, setUser } from '../store/auth-slice';

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  function closePasswordForm() {
    setShowPasswordForm(false);
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
  }

  async function handleSubmit() {
    setSuccess(false);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await apiClient.patch('/auth/change-password', { newPassword });
      dispatch(setUser(data.user));
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-surface-950" contentContainerClassName="p-5 pb-10">
      <Text className="text-2xl font-bold text-neutral-100">Profile</Text>
      <Text className="mb-5 text-sm text-neutral-400">Your account details.</Text>

      <View className="mb-5 rounded-xl border border-blue-800/40 bg-blue-900/10 p-5">
        <Text className="mb-4 text-sm font-semibold text-neutral-100">Account</Text>
        <View className="mb-3 flex-row justify-between">
          <Text className="text-sm text-neutral-400">Name</Text>
          <Text className="text-sm font-medium text-neutral-100">{user?.name}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-sm text-neutral-400">Email</Text>
          <Text className="text-sm font-medium text-neutral-100">{user?.email}</Text>
        </View>
      </View>

      <View className="mb-5 rounded-xl border border-blue-800/40 bg-blue-900/10 p-5">
        {showPasswordForm ? (
          <>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-neutral-100">Change Password</Text>
              <TouchableOpacity onPress={closePasswordForm}>
                <Text className="text-sm font-medium text-neutral-400">Cancel</Text>
              </TouchableOpacity>
            </View>
            <View className="gap-4">
              <View>
                <Text className="mb-1.5 text-sm font-medium text-neutral-200">New Password</Text>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  className="rounded-md border border-surface-600 bg-surface-800 px-3.5 py-3 text-base text-neutral-100"
                />
              </View>
              <View>
                <Text className="mb-1.5 text-sm font-medium text-neutral-200">Confirm Password</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  className="rounded-md border border-surface-600 bg-surface-800 px-3.5 py-3 text-base text-neutral-100"
                />
              </View>

              {error && <Text className="text-sm text-red-400">{error}</Text>}
              {success && <Text className="text-sm text-blue-400">Password updated.</Text>}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                className="items-center rounded-md bg-blue-600 px-4 py-3 disabled:opacity-50"
              >
                {submitting ? <ActivityIndicator color="#fff" /> : <Text className="text-sm font-semibold text-white">Update Password</Text>}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity
            onPress={() => setShowPasswordForm(true)}
            className="flex-row items-center justify-between"
          >
            <Text className="text-sm font-semibold text-neutral-100">Change Password</Text>
            <Text className="text-sm font-medium text-blue-400">Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={() => dispatch(logout())}
        className="items-center rounded-md bg-white/5 px-4 py-3"
      >
        <Text className="text-sm font-medium text-neutral-300">Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
