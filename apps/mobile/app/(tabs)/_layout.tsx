import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../src/constants/theme';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    home: '🏠',
    voices: '🎙️',
    alarms: '⏰',
    friends: '👥',
    library: '📚',
    settings: '⚙️',
  };
  return (
    <Text style={[styles.icon, focused && styles.iconFocused]}>
      {icons[name] || '📱'}
    </Text>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab.home'),
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="voices"
        options={{
          title: t('tab.voices'),
          tabBarIcon: ({ focused }) => <TabIcon name="voices" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="alarms"
        options={{
          title: t('tab.alarms'),
          tabBarIcon: ({ focused }) => <TabIcon name="alarms" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: t('tab.friends'),
          tabBarIcon: ({ focused }) => <TabIcon name="friends" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: t('tab.library'),
          tabBarIcon: ({ focused }) => <TabIcon name="library" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tab.settings'),
          tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: Colors.light.border,
    borderTopWidth: 1,
    height: 85,
    paddingTop: 8,
    paddingBottom: 28,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  icon: {
    fontSize: 22,
    opacity: 0.5,
  },
  iconFocused: {
    opacity: 1,
  },
});
