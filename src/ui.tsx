import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export const C = { navy: '#17324d', blue: '#2f6f9f', gold: '#d6a84f', bg: '#f4f7fa', card: '#fff', text: '#17212b', muted: '#667788', border: '#dce4ea', green: '#2e8b57' };

export function Page({ children, title, subtitle, onBack }: { children: React.ReactNode; title: string; subtitle?: string; onBack?: () => void }) {
  return <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.top}><Pressable onPress={onBack} style={styles.back}>{onBack ? <Text style={styles.backText}>‹</Text> : null}</Pressable><View style={styles.heading}><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View><Text style={styles.logo}>ع</Text></View>
    {children}
  </ScrollView>;
}

export function Card({ children, onPress, style }: { children: React.ReactNode; onPress?: () => void; style?: any }) {
  const body = <View style={[styles.card, style]}>{children}</View>;
  return onPress ? <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.78 : 1 }]}>{body}</Pressable> : body;
}

export function Action({ label, icon, onPress, secondary = false }: { label: string; icon?: string; onPress: () => void; secondary?: boolean }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.action, secondary && styles.actionSecondary, pressed && { opacity: 0.78 }]}><Text style={styles.actionIcon}>{icon}</Text><Text style={[styles.actionText, secondary && styles.actionTextSecondary]}>{label}</Text></Pressable>;
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) { return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>; }

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg }, content: { padding: 18, paddingTop: 24, paddingBottom: 40 },
  top: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 20, minHeight: 54 }, heading: { flex: 1, alignItems: 'flex-end' }, title: { color: C.navy, fontSize: 25, fontWeight: '800' }, subtitle: { color: C.muted, marginTop: 3, fontSize: 13 }, logo: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.navy, color: '#fff', textAlign: 'center', textAlignVertical: 'center', fontSize: 25, fontWeight: '800', overflow: 'hidden' }, back: { width: 42, alignItems: 'flex-start' }, backText: { fontSize: 38, color: C.navy, lineHeight: 42 },
  card: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12, shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }, section: { marginTop: 8, marginBottom: 6 }, sectionTitle: { color: C.navy, fontSize: 18, fontWeight: '800', textAlign: 'right', marginBottom: 10 },
  action: { backgroundColor: C.navy, borderRadius: 14, minHeight: 54, paddingHorizontal: 16, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, actionSecondary: { backgroundColor: '#eef3f7', borderColor: C.border, borderWidth: 1 }, actionIcon: { fontSize: 20, marginLeft: 9 }, actionText: { color: '#fff', fontWeight: '800', fontSize: 15 }, actionTextSecondary: { color: C.navy },
});
