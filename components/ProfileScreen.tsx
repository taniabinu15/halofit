import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ProfileStat {
  label: string;
  value: string;
}

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  showChevron?: boolean;
}

const profileStats: ProfileStat[] = [
  { label: 'Workouts', value: '127' },
  { label: 'Total Calories', value: '48,392' },
  { label: 'Total Duration', value: '98h 22m' },
  { label: 'Avg Heart Rate', value: '145 bpm' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing coming soon!');
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'Settings screen coming soon!');
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'Notification settings coming soon!');
  };

  const handlePrivacy = () => {
    Alert.alert('Privacy', 'Privacy settings coming soon!');
  };

  const handleSupport = () => {
    Alert.alert('Support', 'Contact support coming soon!');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {
          Alert.alert('Logged Out', 'You have been logged out successfully.');
        }}
      ]
    );
  };

  const menuItems: MenuItem[] = [
    {
      id: '1',
      title: 'Edit Profile',
      icon: 'person-outline',
      onPress: handleEditProfile,
      showChevron: true,
    },
    {
      id: '2',
      title: 'Settings',
      icon: 'settings-outline',
      onPress: handleSettings,
      showChevron: true,
    },
    {
      id: '3',
      title: 'Notifications',
      icon: 'notifications-outline',
      onPress: handleNotifications,
      showChevron: true,
    },
    {
      id: '4',
      title: 'Privacy',
      icon: 'shield-outline',
      onPress: handlePrivacy,
      showChevron: true,
    },
    {
      id: '5',
      title: 'Support',
      icon: 'help-circle-outline',
      onPress: handleSupport,
      showChevron: true,
    },
    {
      id: '6',
      title: 'Logout',
      icon: 'log-out-outline',
      onPress: handleLogout,
      showChevron: false,
    },
  ];

  const MenuItem = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
      <View style={styles.menuItemContent}>
        <Ionicons 
          name={item.icon} 
          size={20} 
          color={item.id === '6' ? '#dc2626' : '#6b7280'} 
        />
        <Text style={[
          styles.menuItemText, 
          item.id === '6' && styles.menuItemTextDanger
        ]}>
          {item.title}
        </Text>
      </View>
      {item.showChevron && (
        <Ionicons name="chevron-forward" size={16} color="#6b7280" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color="#000" />
            </View>
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Ionicons name="pencil" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>Sarah Johnson</Text>
          <Text style={styles.userEmail}>sarah.johnson@email.com</Text>
          <Text style={styles.memberSince}>Member since January 2024</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            {profileStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Achievements Summary */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Recent Achievement</Text>
          <View style={styles.achievementCard}>
            <View style={styles.achievementIcon}>
              <Ionicons name="medal" size={24} color="#fbbf24" />
            </View>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>Week Warrior</Text>
              <Text style={styles.achievementDescription}>
                Completed 5 workouts in one week
              </Text>
              <Text style={styles.achievementDate}>Earned 2 days ago</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <MenuItem key={item.id} item={item} />
          ))}
        </View>

        {/* App Info */}
        <View style={styles.appInfoSection}>
          <Text style={styles.appVersion}>FitnessTracker v1.0.0</Text>
          <Text style={styles.appInfo}>Built with React Native & Expo</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  profileHeader: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffc0cb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f3f4f6',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  memberSince: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statsSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  achievementsSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 16,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  menuSection: {
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
  },
  menuItemTextDanger: {
    color: '#dc2626',
  },
  appInfoSection: {
    alignItems: 'center',
    padding: 24,
  },
  appVersion: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  appInfo: {
    fontSize: 12,
    color: '#9ca3af',
  },
});