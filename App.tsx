import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

import { showInterstitial, showRewarded } from './src/ads';
import { COLORS, GAME_CARDS, GameMode, SORT_COLORS } from './src/gameData';

type SavedProgress = {
  coins: number;
  best: Record<GameMode, number>;
  streak: number;
  lastPlayed: string | null;
  runs: number;
};

const STORAGE_KEY = '@oddly-fun/progress-v1';
const DEFAULT_PROGRESS: SavedProgress = {
  coins: 0,
  best: { pop: 0, odd: 0, sort: 0 },
  streak: 0,
  lastPlayed: null,
  runs: 0,
};

const POP_COUNT = 20;
const SORT_QUEUE_SIZE = 24;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function makeOddRound(round: number) {
  const pairs = [
    ['😎', '🥸'],
    ['🍋', '🍊'],
    ['🐸', '🐢'],
    ['🌕', '🌝'],
    ['👻', '💀'],
    ['🍕', '🍰'],
    ['🧠', '🫀'],
  ];
  const [base, odd] = pairs[round % pairs.length];
  const size = round > 8 ? 25 : 16;
  const oddIndex = Math.floor(Math.random() * size);
  return {
    cells: Array.from({ length: size }, (_, index) =>
      index === oddIndex ? odd : base,
    ),
    oddIndex,
    columns: size === 25 ? 5 : 4,
  };
}

function makeSortQueue() {
  return Array.from(
    { length: SORT_QUEUE_SIZE },
    () => SORT_COLORS[Math.floor(Math.random() * SORT_COLORS.length)],
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState<SavedProgress>(DEFAULT_PROGRESS);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<GameMode | 'home'>('home');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [result, setResult] = useState<{
    game: GameMode;
    score: number;
    coins: number;
    isBest: boolean;
  } | null>(null);
  const [popCells, setPopCells] = useState<boolean[]>(
    Array(POP_COUNT).fill(false),
  );
  const [popRound, setPopRound] = useState(1);
  const [oddRound, setOddRound] = useState(0);
  const [oddBoard, setOddBoard] = useState(() => makeOddRound(0));
  const [sortQueue, setSortQueue] = useState<string[]>(makeSortQueue);
  const [combo, setCombo] = useState(0);
  const finishingRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!value) return;
        const stored = JSON.parse(value) as Partial<SavedProgress>;
        setProgress({
          ...DEFAULT_PROGRESS,
          ...stored,
          best: { ...DEFAULT_PROGRESS.best, ...stored.best },
        });
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress)).catch(
      () => undefined,
    );
  }, [loaded, progress]);

  const finishGame = useCallback(
    async (finishedMode: GameMode, finalScore: number) => {
      if (finishingRef.current) return;
      finishingRef.current = true;
      await Haptics.notificationAsync(
        finalScore > 0
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      );

      const earned = Math.max(3, Math.floor(finalScore / 2));
      const today = todayKey();
      const nextRuns = progress.runs + 1;
      const isBest = finalScore > progress.best[finishedMode];
      const nextStreak =
        progress.lastPlayed === today
          ? progress.streak
          : progress.lastPlayed === yesterdayKey()
            ? progress.streak + 1
            : 1;

      setProgress((current) => ({
        ...current,
        coins: current.coins + earned,
        runs: current.runs + 1,
        streak: nextStreak,
        lastPlayed: today,
        best: {
          ...current.best,
          [finishedMode]: Math.max(current.best[finishedMode], finalScore),
        },
      }));
      setResult({ game: finishedMode, score: finalScore, coins: earned, isBest });
      setMode('home');

      if (nextRuns % 4 === 0) {
        showInterstitial().catch(() => undefined);
      }
    },
    [progress],
  );

  useEffect(() => {
    if (mode === 'home' || result) return;
    if (timeLeft <= 0) {
      finishGame(mode, score);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [finishGame, mode, result, score, timeLeft]);

  const startGame = useCallback((game: GameMode) => {
    finishingRef.current = false;
    setResult(null);
    setMode(game);
    setScore(0);
    setCombo(0);
    setPopRound(1);
    setPopCells(Array(POP_COUNT).fill(false));
    setOddRound(0);
    setOddBoard(makeOddRound(0));
    setSortQueue(makeSortQueue());
    setTimeLeft(game === 'sort' ? 25 : 20);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => undefined,
    );
  }, []);

  const tapBubble = useCallback((index: number) => {
    setPopCells((current) => {
      if (current[index]) return current;
      const next = [...current];
      next[index] = true;
      const remaining = next.some((value) => !value);
      setScore((value) => value + 1);
      setCombo((value) => value + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );
      if (!remaining) {
        setScore((value) => value + 5);
        setPopRound((value) => value + 1);
        setTimeout(() => setPopCells(Array(POP_COUNT).fill(false)), 120);
      }
      return next;
    });
  }, []);

  const pickOdd = useCallback(
    (index: number) => {
      if (index === oddBoard.oddIndex) {
        const nextRound = oddRound + 1;
        setScore((value) => value + 3 + Math.floor(nextRound / 3));
        setCombo((value) => value + 1);
        setOddRound(nextRound);
        setOddBoard(makeOddRound(nextRound));
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => undefined);
      } else {
        setScore((value) => Math.max(0, value - 2));
        setCombo(0);
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error,
        ).catch(() => undefined);
      }
    },
    [oddBoard.oddIndex, oddRound],
  );

  const sortColor = useCallback(
    (color: string) => {
      if (!sortQueue.length || mode !== 'sort') return;
      if (sortQueue[0] === color) {
        const next = sortQueue.slice(1);
        setSortQueue(next);
        setScore((value) => value + 2);
        setCombo((value) => value + 1);
        Haptics.selectionAsync().catch(() => undefined);
        if (!next.length) {
          finishGame('sort', score + 12);
        }
      } else {
        setScore((value) => Math.max(0, value - 1));
        setCombo(0);
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        ).catch(() => undefined);
      }
    },
    [finishGame, mode, score, sortQueue],
  );

  const claimReward = async () => {
    const earned = await showRewarded().catch(() => false);
    if (!earned) return;
    setProgress((current) => ({ ...current, coins: current.coins + 25 }));
    setResult((current) =>
      current ? { ...current, coins: current.coins + 25 } : current,
    );
  };

  const activeGame = useMemo(
    () => (mode === 'home' ? null : GAME_CARDS.find((game) => game.id === mode)),
    [mode],
  );

  if (!loaded) {
    return (
      <LinearGradient colors={['#FFF8E8', '#F5F1FF']} style={styles.loading}>
        <Text style={styles.logoMark}>◉</Text>
        <Text style={styles.loadingText}>Making something oddly fun…</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {mode === 'home' ? (
        <ScrollView
          contentContainerStyle={[
            styles.homeContent,
            { paddingTop: Math.max(insets.top, 18), paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <View>
              <Text style={styles.eyebrow}>Knitlly Technology presents</Text>
              <Text style={styles.logo}>ODDLY FUN</Text>
            </View>
            <View style={styles.coinPill}>
              <Text style={styles.coinIcon}>✦</Text>
              <Text style={styles.coinText}>{progress.coins}</Text>
            </View>
          </View>

          <LinearGradient
            colors={['#19172E', '#40356F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroGlow} />
            <Text style={styles.heroKicker}>NO RULEBOOK. JUST TAP.</Text>
            <Text style={styles.heroTitle}>Tiny games.{'\n'}Big brain tickle.</Text>
            <Text style={styles.heroCopy}>
              Three instant games, one thumb, twenty seconds. Chase a cleaner
              run every time.
            </Text>
            <Pressable
              onPress={() => startGame(GAME_CARDS[progress.runs % 3].id)}
              style={({ pressed }) => [
                styles.playButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.playButtonText}>SURPRISE ME</Text>
              <Text style={styles.playArrow}>→</Text>
            </Pressable>
          </LinearGradient>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{progress.streak}</Text>
              <Text style={styles.statLabel}>DAY STREAK</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {Math.max(...Object.values(progress.best))}
              </Text>
              <Text style={styles.statLabel}>TOP SCORE</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{progress.runs}</Text>
              <Text style={styles.statLabel}>RUNS</Text>
            </View>
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Pick your dopamine</Text>
            <Text style={styles.sectionMeta}>20 sec each</Text>
          </View>

          {GAME_CARDS.map((game, index) => (
            <Pressable
              key={game.id}
              onPress={() => startGame(game.id)}
              style={({ pressed }) => [
                styles.gameCard,
                { backgroundColor: game.background },
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.gameNumber}>
                <Text style={styles.gameNumberText}>0{index + 1}</Text>
              </View>
              <View style={styles.gameCopy}>
                <Text style={styles.gameTag}>{game.tag}</Text>
                <Text style={styles.gameTitle}>{game.title}</Text>
                <Text style={styles.gameSubtitle}>{game.subtitle}</Text>
                <Text style={styles.bestLabel}>
                  BEST {progress.best[game.id]}
                </Text>
              </View>
              <View style={[styles.gameIcon, { backgroundColor: game.accent }]}>
                <Text style={styles.gameEmoji}>{game.emoji}</Text>
              </View>
            </Pressable>
          ))}

          <View style={styles.adWrap}>
            <Text style={styles.adLabel}>ADVERTISEMENT</Text>
            <BannerAd
              unitId={
                process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || TestIds.ADAPTIVE_BANNER
              }
              size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
              requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            />
          </View>
        </ScrollView>
      ) : (
        <SafeAreaView style={styles.gameScreen} edges={['top', 'bottom']}>
          <View style={styles.gameHeader}>
            <Pressable
              onPress={() => finishGame(mode, score)}
              hitSlop={14}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
            <View style={styles.timerTrack}>
              <View
                style={[
                  styles.timerFill,
                  {
                    width: `${Math.max(0, (timeLeft / (mode === 'sort' ? 25 : 20)) * 100)}%`,
                    backgroundColor: activeGame?.accent,
                  },
                ]}
              />
            </View>
            <Text style={styles.timerText}>{timeLeft}</Text>
          </View>

          <View style={styles.gameScoreRow}>
            <View>
              <Text style={styles.gameModeLabel}>{activeGame?.tag}</Text>
              <Text style={styles.gameModeTitle}>{activeGame?.title}</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreValue}>{score}</Text>
              <Text style={styles.scoreLabel}>SCORE</Text>
            </View>
          </View>

          {mode === 'pop' && (
            <View style={styles.playArea}>
              <Text style={styles.instruction}>
                Pop every bubble · Round {popRound}
              </Text>
              <View style={styles.popGrid}>
                {popCells.map((popped, index) => (
                  <Pressable
                    key={`${popRound}-${index}`}
                    onPress={() => tapBubble(index)}
                    disabled={popped}
                    style={[
                      styles.bubble,
                      {
                        backgroundColor: COLORS[index % COLORS.length],
                        transform: [{ scale: popped ? 0.1 : 1 }],
                        opacity: popped ? 0 : 1,
                      },
                    ]}
                  >
                    <View style={styles.bubbleShine} />
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {mode === 'odd' && (
            <View style={styles.playArea}>
              <Text style={styles.instruction}>Find the odd one · Don’t blink</Text>
              <View
                style={[
                  styles.oddGrid,
                  { maxWidth: oddBoard.columns === 5 ? 350 : 330 },
                ]}
              >
                {oddBoard.cells.map((emoji, index) => (
                  <Pressable
                    key={`${oddRound}-${index}`}
                    onPress={() => pickOdd(index)}
                    style={({ pressed }) => [
                      styles.oddCell,
                      {
                        width: oddBoard.columns === 5 ? '18%' : '23%',
                        aspectRatio: 1,
                      },
                      pressed && styles.oddPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.oddEmoji,
                        { fontSize: oddBoard.columns === 5 ? 35 : 44 },
                      ]}
                    >
                      {emoji}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {mode === 'sort' && (
            <View style={styles.playArea}>
              <Text style={styles.instruction}>Send each drop to its color</Text>
              <View style={styles.sortStage}>
                <View style={styles.queuePreview}>
                  {sortQueue.slice(0, 5).map((color, index) => (
                    <View
                      key={`${sortQueue.length}-${index}`}
                      style={[
                        styles.queueDot,
                        {
                          backgroundColor: color,
                          transform: [{ scale: 1 - index * 0.1 }],
                          opacity: 1 - index * 0.14,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.queueRemaining}>{sortQueue.length} LEFT</Text>
                <View style={styles.binRow}>
                  {SORT_COLORS.map((color) => (
                    <Pressable
                      key={color}
                      onPress={() => sortColor(color)}
                      style={({ pressed }) => [
                        styles.bin,
                        { borderColor: color, backgroundColor: `${color}20` },
                        pressed && {
                          backgroundColor: color,
                          transform: [{ translateY: 5 }],
                        },
                      ]}
                    >
                      <View style={[styles.binSlot, { backgroundColor: color }]} />
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          )}

          <View style={styles.comboRow}>
            <Text style={styles.comboText}>COMBO ×{combo}</Text>
            <Text style={styles.comboHint}>Keep the rhythm</Text>
          </View>
        </SafeAreaView>
      )}

      <Modal visible={Boolean(result)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.resultCard}>
            <Text style={styles.resultEyebrow}>
              {result?.isBest ? 'NEW PERSONAL BEST' : 'RUN COMPLETE'}
            </Text>
            <Text style={styles.resultScore}>{result?.score}</Text>
            <Text style={styles.resultScoreLabel}>POINTS</Text>
            <View style={styles.rewardPill}>
              <Text style={styles.rewardText}>✦ +{result?.coins} coins</Text>
            </View>
            <Pressable
              onPress={() => result && startGame(result.game)}
              style={({ pressed }) => [
                styles.resultPrimary,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.resultPrimaryText}>PLAY AGAIN</Text>
            </Pressable>
            <Pressable onPress={claimReward} style={styles.rewardButton}>
              <Text style={styles.rewardButtonText}>▶ WATCH AD · +25 COINS</Text>
            </Pressable>
            <Pressable onPress={() => setResult(null)} style={styles.homeButton}>
              <Text style={styles.homeButtonText}>BACK TO ALL GAMES</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF9ED' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  logoMark: { fontSize: 58, color: '#FF5C35', fontWeight: '900' },
  loadingText: { color: '#332C45', fontSize: 16, fontWeight: '700' },
  homeContent: { paddingHorizontal: 18, gap: 18 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#82788C',
    textTransform: 'uppercase',
  },
  logo: {
    fontSize: 27,
    lineHeight: 30,
    color: '#211D2D',
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E0D4',
  },
  coinIcon: { color: '#FF9F1C', fontSize: 16 },
  coinText: { color: '#241E2C', fontWeight: '900', fontSize: 15 },
  hero: {
    minHeight: 330,
    overflow: 'hidden',
    borderRadius: 32,
    padding: 24,
    justifyContent: 'flex-end',
  },
  heroGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#8B6EFF',
    opacity: 0.33,
    right: -55,
    top: -65,
  },
  heroKicker: {
    color: '#C8BBFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.7,
    marginBottom: 9,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 43,
    lineHeight: 43,
    letterSpacing: -2,
    fontWeight: '900',
  },
  heroCopy: {
    color: '#D8D2E7',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 13,
    maxWidth: 275,
  },
  playButton: {
    marginTop: 22,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 18,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#FFDC5E',
  },
  playButtonText: {
    color: '#211D2D',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  playArrow: { color: '#211D2D', fontSize: 21, fontWeight: '800' },
  buttonPressed: { transform: [{ scale: 0.97 }], opacity: 0.92 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EDE5D9',
  },
  statValue: { fontSize: 24, fontWeight: '900', color: '#251F31' },
  statLabel: {
    marginTop: 3,
    color: '#8B8192',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#251F31',
    fontSize: 23,
    letterSpacing: -0.7,
    fontWeight: '900',
  },
  sectionMeta: { color: '#9A8F99', fontSize: 12, fontWeight: '700' },
  gameCard: {
    minHeight: 156,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 27,
    padding: 18,
    overflow: 'hidden',
  },
  cardPressed: { transform: [{ scale: 0.985 }] },
  gameNumber: {
    position: 'absolute',
    top: 15,
    right: 18,
    opacity: 0.33,
  },
  gameNumberText: { fontSize: 13, fontWeight: '900', color: '#342E3C' },
  gameCopy: { flex: 1, paddingRight: 12 },
  gameTag: {
    color: '#5C5265',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.25,
  },
  gameTitle: {
    color: '#201B29',
    fontSize: 26,
    letterSpacing: -0.8,
    fontWeight: '900',
    marginTop: 4,
  },
  gameSubtitle: {
    color: '#625967',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
    maxWidth: 190,
  },
  bestLabel: {
    marginTop: 13,
    color: '#2D2635',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  gameIcon: {
    width: 82,
    height: 82,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '4deg' }],
  },
  gameEmoji: { fontSize: 44 },
  adWrap: {
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#F1EBDD',
    overflow: 'hidden',
  },
  adLabel: {
    color: '#9A9187',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  gameScreen: { flex: 1, backgroundColor: '#FFF9ED', paddingHorizontal: 18 },
  gameHeader: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECE4D8',
  },
  closeText: { color: '#302A38', fontSize: 26, lineHeight: 27 },
  timerTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E9E1D4',
    overflow: 'hidden',
  },
  timerFill: { height: '100%', borderRadius: 999 },
  timerText: {
    width: 27,
    textAlign: 'right',
    color: '#2C2733',
    fontSize: 18,
    fontWeight: '900',
  },
  gameScoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 18,
  },
  gameModeLabel: {
    color: '#8B7E91',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  gameModeTitle: {
    color: '#201B29',
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: -1,
  },
  scoreBox: { alignItems: 'flex-end' },
  scoreValue: {
    color: '#201B29',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 36,
  },
  scoreLabel: {
    color: '#928797',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  playArea: {
    flex: 1,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE3D7',
    alignItems: 'center',
    padding: 18,
    overflow: 'hidden',
  },
  instruction: {
    color: '#766B7C',
    fontSize: 13,
    fontWeight: '800',
    marginVertical: 8,
  },
  popGrid: {
    flex: 1,
    width: '100%',
    maxWidth: 355,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    gap: 11,
  },
  bubble: {
    width: 61,
    height: 61,
    borderRadius: 31,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.72)',
    shadowColor: '#281B3A',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    overflow: 'hidden',
  },
  bubbleShine: {
    width: 20,
    height: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.58)',
    marginTop: 9,
    marginLeft: 10,
    transform: [{ rotate: '-25deg' }],
  },
  oddGrid: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'center',
    gap: 7,
  },
  oddCell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#F7F2EA',
  },
  oddPressed: { backgroundColor: '#FFE49A', transform: [{ scale: 0.94 }] },
  oddEmoji: { textAlign: 'center' },
  sortStage: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queuePreview: {
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  queueDot: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    shadowColor: '#20172A',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
  },
  queueRemaining: {
    color: '#8D8293',
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '900',
    marginBottom: 30,
  },
  binRow: { flexDirection: 'row', gap: 13 },
  bin: {
    width: 66,
    height: 78,
    borderWidth: 4,
    borderRadius: 18,
    padding: 8,
    justifyContent: 'flex-end',
  },
  binSlot: { height: 9, borderRadius: 8, opacity: 0.8 },
  comboRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 62,
    paddingHorizontal: 4,
  },
  comboText: {
    color: '#FF5C35',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  comboHint: { color: '#958A99', fontSize: 12, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,20,35,0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  resultCard: {
    width: '100%',
    maxWidth: 390,
    alignItems: 'center',
    backgroundColor: '#FFF9ED',
    borderRadius: 34,
    padding: 28,
  },
  resultEyebrow: {
    color: '#FF5C35',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  resultScore: {
    color: '#211C2A',
    fontSize: 78,
    lineHeight: 84,
    fontWeight: '900',
    letterSpacing: -4,
    marginTop: 10,
  },
  resultScoreLabel: {
    color: '#8D8291',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  rewardPill: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: '#FFE8A8',
    borderRadius: 999,
  },
  rewardText: { color: '#493A10', fontSize: 13, fontWeight: '900' },
  resultPrimary: {
    width: '100%',
    marginTop: 25,
    paddingVertical: 17,
    borderRadius: 17,
    alignItems: 'center',
    backgroundColor: '#241E30',
  },
  resultPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  rewardButton: {
    width: '100%',
    marginTop: 10,
    paddingVertical: 15,
    borderRadius: 17,
    alignItems: 'center',
    backgroundColor: '#FFDD66',
  },
  rewardButtonText: {
    color: '#352B08',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  homeButton: { paddingVertical: 17 },
  homeButtonText: {
    color: '#7A7080',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
