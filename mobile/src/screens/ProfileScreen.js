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
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-5 pb-10">
      <Text className="text-2xl font-bold text-slate-900">Profile</Text>
      <Text className="mb-5 text-sm text-slate-500">Your account details.</Text>

      <View className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-5">
        <Text className="mb-4 text-sm font-semibold text-slate-900">Account</Text>
        <View className="mb-3 flex-row justify-between">
          <Text className="text-sm text-slate-500">Name</Text>
          <Text className="text-sm font-medium text-slate-900">{user?.name}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-sm text-slate-500">Email</Text>
          <Text className="text-sm font-medium text-slate-900">{user?.email}</Text>
        </View>
      </View>

      <View className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-5">
        {showPasswordForm ? (
          <>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-slate-900">Change Password</Text>
              <TouchableOpacity onPress={closePasswordForm}>
                <Text className="text-sm font-medium text-slate-500">Cancel</Text>
              </TouchableOpacity>
            </View>
            <View className="gap-4">
              <View>
                <Text className="mb-1.5 text-sm font-medium text-slate-700">New Password</Text>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  className="rounded-md border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-900"
                />
              </View>
              <View>
                <Text className="mb-1.5 text-sm font-medium text-slate-700">Confirm Password</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  className="rounded-md border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-900"
                />
              </View>

              {error && <Text className="text-sm text-red-600">{error}</Text>}
              {success && <Text className="text-sm text-blue-600">Password updated.</Text>}

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
            <Text className="text-sm font-semibold text-slate-900">Change Password</Text>
            <Text className="text-sm font-medium text-blue-600">Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={() => dispatch(logout())}
        className="items-center rounded-md bg-slate-100 px-4 py-3"
      >
        <Text className="text-sm font-medium text-slate-600">Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
