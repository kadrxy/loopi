import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appStore, useApp } from '@/data';
import type { ImageRef } from '@/domain/types';
import { useT } from '@/i18n';
import { Avatar, Button, colors, font, Glass, Halo, Icon, IconButton, radius, Scrim, type as T } from '@/ui';

const USERNAME = /^[a-z0-9._]{3,20}$/;

async function pick(aspect: [number, number]): Promise<string | undefined> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect });
  return res.canceled ? undefined : res.assets[0]?.uri;
}

/** Photo, cover, name, username, about. Saved on the device until the backend exists. */
export default function ProfileEdit() {
  const t = useT();
  const router = useRouter();
  const meId = useApp((s) => s.meId);
  const me = useApp((s) => s.graph.users[s.meId]);
  const [name, setName] = useState(me?.name ?? '');
  const [username, setUsername] = useState(me?.username ?? '');
  const [bio, setBio] = useState(me?.bio ?? '');
  const [avatar, setAvatar] = useState<ImageRef | undefined>(me?.avatar);
  const [cover, setCover] = useState<ImageRef | undefined>(me?.cover);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/profile'));
  const save = async () => {
    const u = username.trim().toLowerCase();
    if (!name.trim()) return setError(t('name'));
    if (!USERNAME.test(u)) return setError(t('err_username'));
    setSaving(true);
    await appStore.getState().updateProfile({ name: name.trim(), username: u, bio: bio.trim(), avatar, cover });
    setSaving(false);
    close();
  };

  if (!me) return null;
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Halo style={styles.halo} />
      <View style={styles.bar}>
        <IconButton name="close" size="sm" label={t('close')} onPress={close} />
        <Text style={T.h2}>{t('edit_profile')}</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Pressable onPress={async () => setCover((await pick([16, 9])) ?? cover)} style={styles.cover} accessibilityRole="button" accessibilityLabel={t('change_cover')}>
            {cover != null && <Image source={cover} style={StyleSheet.absoluteFill} contentFit="cover" />}
            <Scrim from={0.1} to={0.7} />
            <Glass dark radius={radius.pill} style={styles.coverBtn}>
              <Icon name="galleryAdd" size={15} />
              <Text style={styles.coverText}>{t('change_cover')}</Text>
            </Glass>
          </Pressable>

          <Pressable onPress={async () => setAvatar((await pick([1, 1])) ?? avatar)} style={styles.avatarWrap} accessibilityRole="button" accessibilityLabel={t('change_photo')}>
            <View style={styles.avatarRing}>
              <Avatar user={{ name: name || me.name }} image={avatar} size={96} />
            </View>
            <View style={styles.camBadge}>
              <Icon name="camera" size={15} filled color={colors.onWhite} />
            </View>
          </Pressable>

          <Field label={t('name')} value={name} onChange={setName} max={40} />
          <Field label={t('username')} value={username} onChange={(v) => setUsername(v.toLowerCase())} max={20} prefix="@" autoCapitalize="none" />
          <Field label={t('bio')} value={bio} onChange={setBio} max={150} multiline />
          {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>
        <View style={styles.footer}>
          <Button title={t('save')} onPress={save} disabled={saving} />
        </View>
      </KeyboardAvoidingView>
      <Text style={styles.hidden}>{meId}</Text>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  prefix?: string;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences';
};

function Field({ label, value, onChange, max, prefix, multiline, autoCapitalize }: FieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.count}>
          {value.length}/{max}
        </Text>
      </View>
      <Glass radius={radius.lg} style={styles.inputBox}>
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          value={value}
          onChangeText={onChange}
          maxLength={max}
          multiline={multiline}
          autoCapitalize={autoCapitalize}
          autoCorrect={!prefix}
          placeholderTextColor={colors.t3}
          style={[styles.input, multiline && { minHeight: 76, textAlignVertical: 'top' }]}
          accessibilityLabel={label}
        />
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  halo: { position: 'absolute', top: -130, alignSelf: 'center' },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8 },
  body: { paddingHorizontal: 16, paddingBottom: 24, gap: 14 },
  cover: { height: 150, borderRadius: 26, overflow: 'hidden', backgroundColor: colors.surface, alignItems: 'flex-end', justifyContent: 'flex-start', padding: 12 },
  coverBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12 },
  coverText: { fontFamily: font.semibold, fontSize: 12, color: colors.text },
  avatarWrap: { alignSelf: 'center', marginTop: -62 },
  avatarRing: { padding: 3, borderRadius: 54, backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.text },
  camBadge: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg,
  },
  field: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6 },
  label: { fontFamily: font.semibold, fontSize: 12.5, color: colors.t2 },
  count: { fontFamily: font.regular, fontSize: 11.5, color: colors.t3 },
  inputBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  prefix: { fontFamily: font.semibold, fontSize: 15, color: colors.t3, marginRight: 2 },
  input: { flex: 1, fontFamily: font.regular, fontSize: 15, color: colors.text, paddingVertical: 13 },
  error: { fontFamily: font.medium, fontSize: 12.5, color: colors.text, paddingHorizontal: 6 },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 },
  hidden: { display: 'none' },
});
