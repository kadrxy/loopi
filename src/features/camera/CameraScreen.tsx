import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appStore, SAMPLE_PHOTOS, useApp } from '@/data';
import { isFollowing, isFriend } from '@/domain/rules';
import type { Audience, ImageRef, Place } from '@/domain/types';
import { AUDIENCE_ICON, AUDIENCE_KEY } from '@/features/home/MomentCard';

import { PlacePicker } from './PlacePicker';
import { useT } from '@/i18n';
import { Button, colors, font, Glass, Halo, Icon, IconButton, radius, Sheet } from '@/ui';

const AUDIENCES: Audience[] = ['friends', 'followers', 'everyone'];

type Props = {
  /** Mount the live camera only while the page is on screen (home pager, tabs). */
  active?: boolean;
  /** Shows a close button when given (full-screen route, middle tab). */
  onClose?: () => void;
  /** Called after a moment is shared. */
  onDone: () => void;
};

/** Take or pick a photo, choose who sees it, share. Used by the middle tab, Home's side page and /camera. */
export function CameraScreen({ active = true, onClose, onDone }: Props) {
  const t = useT();
  const [permission, requestPermission] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState(false);
  const [zoom, setZoom] = useState<0 | 0.08>(0);
  const [shot, setShot] = useState<ImageRef | null>(null);
  const [caption, setCaption] = useState('');
  const [picker, setPicker] = useState(false);
  const [place, setPlace] = useState<Place>();
  const [placeOpen, setPlaceOpen] = useState(false);
  const meId = useApp((s) => s.meId);
  const graph = useApp((s) => s.graph);
  const settings = useApp((s) => s.settings);
  const [audience, setAudience] = useState<Audience>(settings.defaultAudience);

  const others = Object.keys(graph.users).filter((id) => id !== meId);
  const friends = others.filter((id) => isFriend(graph, meId, id)).length;
  const followers = others.filter((id) => isFollowing(graph, id, meId)).length;
  const reach = audience === 'friends' ? friends : followers;

  const sample = () => setShot(SAMPLE_PHOTOS[Math.floor(Math.random() * SAMPLE_PHOTOS.length)]);
  const pickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!res.canceled && res.assets[0]?.uri) setShot(res.assets[0].uri);
  };
  const take = async () => {
    if (!permission?.granted || !ready || !cam.current) return sample();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const pic = await cam.current.takePictureAsync({ quality: 0.7 });
    if (pic?.uri) setShot(pic.uri);
  };
  const share = async () => {
    if (shot == null) return;
    await appStore.getState().createMoment({ image: shot, caption: caption.trim(), audience, place });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setShot(null);
    setCaption('');
    setPlace(undefined);
    onDone();
  };
  const close = () => (shot != null ? setShot(null) : onClose?.());

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Halo style={styles.halo} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.finder}>
          {shot != null ? (
            <Image source={shot} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : !active ? (
            // Off screen (Home side page): stay black, never flash the permission prompt.
            <View style={styles.noCam} />
          ) : permission?.granted ? (
            <CameraView
              ref={cam}
              style={StyleSheet.absoluteFill}
              facing={facing}
              flash={flash ? 'on' : 'off'}
              zoom={zoom}
              onCameraReady={() => setReady(true)}
            />
          ) : (
            <View style={styles.noCam}>
              <Icon name="camera" size={34} color={colors.t2} />
              <Text style={styles.noCamText}>{t('cam_permission')}</Text>
              {permission && <Button title={t('cam_allow')} size="md" onPress={requestPermission} />}
            </View>
          )}
          <View style={styles.finderTop}>
            {shot != null || onClose ? <IconButton name="close" size="sm" dark label={t('close')} onPress={close} /> : <View />}
            {shot == null && (
              <View style={styles.row}>
                <IconButton name="flash" size="sm" dark filled={flash} label={t('flash')} onPress={() => setFlash((f) => !f)} />
                <IconButton name="flip" size="sm" dark label={t('flip')} onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))} />
              </View>
            )}
          </View>
          {shot == null && (
            <Glass dark radius={radius.pill} style={styles.zoom}>
              {([0, 0.08] as const).map((z) => (
                <Pressable key={z} onPress={() => setZoom(z)} style={[styles.zoomItem, zoom === z && styles.zoomOn]} accessibilityRole="button">
                  <Text style={[styles.zoomText, zoom === z && { color: colors.onWhite }]}>{z === 0 ? '1×' : '2×'}</Text>
                </Pressable>
              ))}
            </Glass>
          )}
        </View>

        <Pressable onPress={() => setPicker(true)} style={styles.audWrap} accessibilityRole="button" accessibilityLabel={t('who_sees')}>
          <Glass radius={radius.pill} style={styles.aud}>
            <Icon name={AUDIENCE_ICON[audience]} size={16} filled />
            <Text style={styles.audText}>{t(AUDIENCE_KEY[audience])}</Text>
            <Text style={styles.audCount}>· {t('people_count', { n: reach })}</Text>
            <Icon name="caretDown" size={14} color={colors.t2} />
          </Glass>
        </Pressable>

        {shot == null ? (
          <>
            <View style={styles.controls}>
              <Pressable
                onPress={pickFromGallery}
                onLongPress={sample}
                style={styles.thumb}
                accessibilityRole="button"
                accessibilityLabel={t('from_gallery')}
                accessibilityHint={t('use_sample')}>
                <Image source={SAMPLE_PHOTOS[1]} style={StyleSheet.absoluteFill} contentFit="cover" />
                <View style={styles.thumbIcon}>
                  <Icon name="galleryAdd" size={18} />
                </View>
              </Pressable>
              <Pressable
                onPress={take}
                accessibilityRole="button"
                accessibilityLabel={t('shutter')}
                style={({ pressed }) => [styles.shutter, { transform: [{ scale: pressed ? 0.93 : 1 }] }]}>
                <View style={styles.shutterInner} />
              </Pressable>
              <IconButton name="flip" label={t('flip')} onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))} />
            </View>
            <View style={styles.hint}>
              <Icon name="device" size={13} color={colors.t3} />
              <Text style={styles.hintText}>{t('reaches_widgets', { n: friends })}</Text>
            </View>
          </>
        ) : (
          <View style={styles.compose}>
            <Glass radius={radius.lg} style={styles.captionBox}>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder={t('caption_ph')}
                placeholderTextColor={colors.t3}
                maxLength={140}
                style={styles.caption}
                accessibilityLabel={t('caption_ph')}
              />
            </Glass>
            <View style={styles.placeRow}>
              <Pressable
                onPress={() => setPlaceOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={place?.name ?? t('loc_add')}
                style={{ flexShrink: 1 }}>
                <Glass radius={radius.pill} style={styles.placeChip}>
                  <Icon name="pin" size={15} filled={!!place} />
                  <Text style={styles.placeText} numberOfLines={1}>
                    {place?.name ?? t('loc_add')}
                  </Text>
                </Glass>
              </Pressable>
              {place && <IconButton name="close" size="sm" label={t('close')} onPress={() => setPlace(undefined)} />}
            </View>
            <Button title={t('share')} icon="send" onPress={share} />
          </View>
        )}
      </KeyboardAvoidingView>

      <PlacePicker visible={placeOpen} onClose={() => setPlaceOpen(false)} onPick={setPlace} />
      <Sheet
        visible={picker}
        title={t('who_sees')}
        body={settings.isPrivate ? t('aud_everyone_locked') : undefined}
        options={AUDIENCES.map((a) => ({
          label: t(AUDIENCE_KEY[a]),
          icon: AUDIENCE_ICON[a],
          selected: audience === a,
          disabled: a === 'everyone' && settings.isPrivate,
          onPress: () => setAudience(a),
        }))}
        onClose={() => setPicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  halo: { position: 'absolute', top: -130, alignSelf: 'center' },
  finder: {
    flex: 1,
    marginHorizontal: 8,
    marginTop: 6,
    borderRadius: 34,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  noCam: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 28 },
  noCamText: { fontFamily: font.regular, fontSize: 14.5, color: colors.t2, textAlign: 'center' },
  finderTop: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  row: { flexDirection: 'row', gap: 10 },
  zoom: { position: 'absolute', bottom: 14, alignSelf: 'center', flexDirection: 'row', padding: 4, gap: 4 },
  zoomItem: { width: 40, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  zoomOn: { backgroundColor: colors.text },
  zoomText: { fontFamily: font.bold, fontSize: 12, color: colors.t2 },
  audWrap: { alignSelf: 'center', marginTop: 14 },
  aud: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 9, paddingHorizontal: 14 },
  audText: { fontFamily: font.semibold, fontSize: 13.5, color: colors.text },
  audCount: { fontFamily: font.regular, fontSize: 12.5, color: colors.t3 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 34, paddingTop: 18 },
  thumb: { width: 48, height: 48, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.85)' },
  thumbIcon: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.scrim },
  shutter: { width: 82, height: 82, borderRadius: 41, borderWidth: 4, borderColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.text },
  hint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  hintText: { fontFamily: font.regular, fontSize: 11.5, color: colors.t3 },
  compose: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, gap: 12 },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  placeChip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 9, paddingHorizontal: 14 },
  placeText: { flexShrink: 1, fontFamily: font.semibold, fontSize: 13.5, color: colors.text },
  captionBox: { paddingHorizontal: 16 },
  caption: { fontFamily: font.regular, fontSize: 15, color: colors.text, paddingVertical: 14 },
});
