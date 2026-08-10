import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { getCollection, addDocument, subscribeCollection, where } from '../../src/firebase/firestore.service';
import { Button } from '../../src/components/ui/Button';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../src/constants/theme';
import { Timestamp } from 'firebase/firestore';
import { USE_MOCK } from '../../src/constants/mockData';

export default function QuizScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [quizzes, setQuizzes]       = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [loading, setLoading]       = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [answers, setAnswers]       = useState<Record<number, number>>({});
  const [submitted, setSubmitted]   = useState(false);
  const [result, setResult]         = useState<{ score: number; correct: number; total: number } | null>(null);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!profile?.classId) return;
    const unsub = subscribeCollection(
      'quizzes',
      (data) => {
        const now = new Date();
        const active = (data as any[]).filter(q => q.classId === profile.classId);
        setQuizzes(active);
        setLoading(false);
      },
      where('classId', '==', profile.classId ?? '')
    );
    if (!USE_MOCK) {
      getCollection('quiz_submissions', where('studentId', '==', profile.uid)).then(subs => {
        const map: Record<string, any> = {};
        (subs as any[]).forEach((s: any) => (map[s.quizId] = s));
        setSubmissions(map);
      });
    }
    return unsub;
  }, [profile]);

  const startQuiz = (quiz: any) => {
    setActiveQuiz(quiz);
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: false }).start();
  };

  const selectAnswer = (qIdx: number, aIdx: number, total: number) => {
    if (submitted) return;
    const newAnswers = { ...answers, [qIdx]: aIdx };
    setAnswers(newAnswers);
    const answered = Object.keys(newAnswers).length;
    Animated.timing(progress, {
      toValue: answered / total,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;
    const total   = activeQuiz.questions.length;
    const answered = Object.keys(answers).length;
    if (answered < total) {
      Alert.alert('Perhatian', `Masih ada ${total - answered} soal belum dijawab. Lanjutkan?`, [
        { text: 'Kembali', style: 'cancel' },
        { text: 'Submit', onPress: () => doSubmit() },
      ]);
    } else {
      doSubmit();
    }
  };

  const doSubmit = async () => {
    if (!activeQuiz || !profile) return;
    let correct = 0;
    activeQuiz.questions.forEach((q: any, i: number) => {
      if (answers[i] === q.correct) correct++;
    });
    const score = Math.round((correct / activeQuiz.questions.length) * 100);
    const res = { score, correct, total: activeQuiz.questions.length };
    setResult(res);
    setSubmitted(true);

    if (!USE_MOCK) {
      await addDocument('quiz_submissions', {
        quizId: activeQuiz.id,
        studentId: profile.uid,
        answers,
        score,
        correct,
        total: activeQuiz.questions.length,
        submittedAt: Timestamp.now(),
      });
      setSubmissions(s => ({ ...s, [activeQuiz.id]: { score, status: 'submitted' } }));
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  // Hasil kuis
  if (submitted && result && activeQuiz) {
    const pct = result.score;
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.headerTitle}>{activeQuiz.title}</Text>
        </View>
        <ScrollView contentContainerStyle={[styles.resultContent, { paddingBottom: insets.bottom + 24 }]}>
          {/* Score card */}
          <View style={styles.scoreCard}>
            <Text style={styles.scorePct}>{pct}</Text>
            <Text style={styles.scoreLabel}>Nilai</Text>
            <View style={styles.scoreRow}>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreItemVal}>{result.correct}</Text>
                <Text style={styles.scoreItemKey}>Benar</Text>
              </View>
              <View style={styles.scoreItemDivider} />
              <View style={styles.scoreItem}>
                <Text style={styles.scoreItemVal}>{result.total - result.correct}</Text>
                <Text style={styles.scoreItemKey}>Salah</Text>
              </View>
              <View style={styles.scoreItemDivider} />
              <View style={styles.scoreItem}>
                <Text style={styles.scoreItemVal}>{result.total}</Text>
                <Text style={styles.scoreItemKey}>Total</Text>
              </View>
            </View>
          </View>

          {/* Review jawaban */}
          <Text style={styles.reviewTitle}>Review Jawaban</Text>
          {activeQuiz.questions.map((q: any, i: number) => {
            const isCorrect = answers[i] === q.correct;
            return (
              <View key={i} style={[styles.reviewCard, isCorrect ? styles.reviewCorrect : styles.reviewWrong]}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewNum}>Soal {i + 1}</Text>
                  <View style={[styles.reviewBadge, { backgroundColor: isCorrect ? Colors.gray11 : Colors.gray11 }]}>
                    <Ionicons
                      name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                      size={14}
                      color={isCorrect ? Colors.gray3 : Colors.gray1}
                    />
                    <Text style={[styles.reviewBadgeText, { color: isCorrect ? Colors.gray3 : Colors.gray1 }]}>
                      {isCorrect ? 'Benar' : 'Salah'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.reviewQuestion}>{q.question}</Text>
                {q.options.map((opt: string, j: number) => {
                  const isSelected = answers[i] === j;
                  const isAnswer   = q.correct === j;
                  return (
                    <View
                      key={j}
                      style={[
                        styles.reviewOption,
                        isAnswer && styles.reviewOptionCorrect,
                        isSelected && !isAnswer && styles.reviewOptionWrong,
                      ]}
                    >
                      <Text style={styles.reviewOptionText}>{String.fromCharCode(65 + j)}. {opt}</Text>
                      {isAnswer && <Ionicons name="checkmark" size={14} color="#16A34A" />}
                    </View>
                  );
                })}
              </View>
            );
          })}

          <Button title="Selesai" onPress={() => setActiveQuiz(null)} fullWidth style={{ marginTop: Spacing.xl }} />
        </ScrollView>
      </View>
    );
  }

  // Sedang mengerjakan kuis
  if (activeQuiz) {
    const total    = activeQuiz.questions.length;
    const answered = Object.keys(answers).length;
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => Alert.alert('Keluar', 'Jawaban akan hilang. Keluar?', [
            { text: 'Batal', style: 'cancel' },
            { text: 'Keluar', onPress: () => setActiveQuiz(null) },
          ])} hitSlop={8}>
            <Ionicons name="close" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{activeQuiz.title}</Text>
            <Text style={styles.headerSub}>{answered}/{total} dijawab</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressFill, {
            width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.quizContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {activeQuiz.questions.map((q: any, i: number) => (
            <View key={i} style={styles.questionCard}>
              <Text style={styles.questionNum}>Soal {i + 1} dari {total}</Text>
              <Text style={styles.questionText}>{q.question}</Text>
              <View style={styles.options}>
                {q.options.map((opt: string, j: number) => {
                  const selected = answers[i] === j;
                  return (
                    <TouchableOpacity
                      key={j}
                      style={[styles.option, selected && styles.optionSelected]}
                      onPress={() => selectAnswer(i, j, total)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.optionDot, selected && styles.optionDotSelected]}>
                        {selected && <View style={styles.optionDotInner} />}
                      </View>
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                        {String.fromCharCode(65 + j)}. {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          <Button
            title={`Submit Kuis (${answered}/${total})`}
            onPress={submitQuiz}
            fullWidth
            style={{ marginTop: Spacing.base }}
          />
        </ScrollView>
      </View>
    );
  }

  // Daftar kuis
  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Kuis Online</Text>
        <Text style={styles.headerSub}>{quizzes.length} kuis tersedia</Text>
      </View>

      {quizzes.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="help-circle-outline" size={48} color={Colors.gray8} />
          <Text style={styles.emptyTitle}>Belum ada kuis</Text>
          <Text style={styles.emptySub}>Guru belum membuat kuis untuk kelas kamu</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}>
          {quizzes.map(q => {
            const sub = submissions[q.id];
            const now = new Date();
            const isExpired = q.deadline?.toDate?.() < now;
            const daysLeft  = q.deadline ? Math.ceil((q.deadline.toDate().getTime() - now.getTime()) / (1000 * 3600 * 24)) : null;
            return (
              <View key={q.id} style={styles.quizCard}>
                <View style={styles.quizCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.quizTitle}>{q.title}</Text>
                    <Text style={styles.quizMeta}>
                      {q.questions?.length ?? 0} soal · {q.duration ?? 30} menit
                    </Text>
                    {q.deadline && (
                      <Text style={[styles.quizDeadline, isExpired && styles.quizExpired]}>
                        {isExpired ? 'Sudah berakhir' : `Berakhir ${daysLeft === 0 ? 'hari ini' : `${daysLeft} hari lagi`}`}
                      </Text>
                    )}
                  </View>
                  {sub ? (
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreBadgeVal}>{sub.score}</Text>
                      <Text style={styles.scoreBadgeLabel}>nilai</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusPill, isExpired && styles.statusPillExpired]}>
                      <Text style={[styles.statusText, isExpired && styles.statusTextExpired]}>
                        {isExpired ? 'Berakhir' : 'Belum dikerjakan'}
                      </Text>
                    </View>
                  )}
                </View>
                {!sub && !isExpired && (
                  <TouchableOpacity style={styles.startBtn} onPress={() => startQuiz(q)} activeOpacity={0.8}>
                    <Ionicons name="play" size={14} color={Colors.white} />
                    <Text style={styles.startBtnText}>Mulai Kuis</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.black, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl,
    flexDirection: 'row', alignItems: 'flex-end',
  },
  headerTitle: { ...Typography.title3, color: Colors.white },
  headerSub:   { ...Typography.caption1, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
  progressBg: { height: 3, backgroundColor: Colors.gray10 },
  progressFill: { height: '100%', backgroundColor: Colors.black },

  // List
  list: { padding: Spacing.base, gap: 10 },
  quizCard: {
    backgroundColor: Colors.cardBackground, borderRadius: Radius.lg, padding: Spacing.base,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, ...Shadow.sm,
  },
  quizCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  quizTitle:   { ...Typography.headline, color: Colors.black, fontWeight: '600' },
  quizMeta:    { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 3 },
  quizDeadline:{ ...Typography.caption1, color: Colors.gray5, marginTop: 2 },
  quizExpired: { color: Colors.gray7 },
  scoreBadge:  { alignItems: 'center', backgroundColor: Colors.black, borderRadius: 10, padding: 8, minWidth: 50 },
  scoreBadgeVal: { fontSize: 20, fontWeight: '800', color: Colors.white },
  scoreBadgeLabel: { ...Typography.caption2, color: 'rgba(255,255,255,0.6)' },
  statusPill: { backgroundColor: Colors.gray11, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  statusPillExpired: { backgroundColor: Colors.gray10 },
  statusText: { ...Typography.caption1, color: Colors.gray4, fontWeight: '500' },
  statusTextExpired: { color: Colors.gray7 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.black, borderRadius: Radius.md, padding: 10, marginTop: 12,
  },
  startBtnText: { ...Typography.subheadline, color: Colors.white, fontWeight: '600' },

  // Quiz
  quizContent: { padding: Spacing.base },
  questionCard: {
    backgroundColor: Colors.cardBackground, borderRadius: Radius.lg, padding: Spacing.base,
    marginBottom: Spacing.base, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator, ...Shadow.sm,
  },
  questionNum:  { ...Typography.caption1, color: Colors.tertiaryLabel, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  questionText: { ...Typography.headline, color: Colors.black, marginBottom: Spacing.base, lineHeight: 24 },
  options:      { gap: 8 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: Spacing.md, borderRadius: Radius.md,
    backgroundColor: Colors.gray11,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  optionSelected: { backgroundColor: Colors.black, borderColor: Colors.black },
  optionDot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.gray8,
    alignItems: 'center', justifyContent: 'center',
  },
  optionDotSelected: { borderColor: Colors.white },
  optionDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.white },
  optionText:         { ...Typography.body, color: Colors.secondaryLabel, flex: 1 },
  optionTextSelected: { color: Colors.white, fontWeight: '600' },

  // Result
  resultContent: { padding: Spacing.base },
  scoreCard: {
    backgroundColor: Colors.black, borderRadius: Radius.xl, padding: Spacing.xl,
    alignItems: 'center', marginBottom: Spacing.xl,
  },
  scorePct:    { fontSize: 64, fontWeight: '800', color: Colors.white, letterSpacing: -2 },
  scoreLabel:  { ...Typography.subheadline, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  scoreRow:    { flexDirection: 'row', marginTop: Spacing.base, gap: 20 },
  scoreItem:   { alignItems: 'center' },
  scoreItemVal:{ ...Typography.title3, color: Colors.white },
  scoreItemKey:{ ...Typography.caption1, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  scoreItemDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)' },
  reviewTitle: { ...Typography.headline, color: Colors.black, marginBottom: Spacing.md },
  reviewCard: {
    backgroundColor: Colors.cardBackground, borderRadius: Radius.lg, padding: Spacing.base,
    marginBottom: 10, borderLeftWidth: 3, borderLeftColor: Colors.separator,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  reviewCorrect: { borderLeftColor: Colors.gray3 },
  reviewWrong:   { borderLeftColor: Colors.gray1 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewNum:    { ...Typography.caption1, color: Colors.tertiaryLabel, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  reviewBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  reviewBadgeText: { ...Typography.caption1, fontWeight: '700' },
  reviewQuestion:  { ...Typography.subheadline, color: Colors.black, fontWeight: '500', marginBottom: 10, lineHeight: 22 },
  reviewOption:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, borderRadius: Radius.sm, marginBottom: 6, backgroundColor: Colors.gray11 },
  reviewOptionCorrect: { backgroundColor: Colors.gray11 },
  reviewOptionWrong:   { backgroundColor: Colors.gray11 },
  reviewOptionText:    { ...Typography.footnote, color: Colors.secondaryLabel, flex: 1 },
  empty:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { ...Typography.headline, color: Colors.secondaryLabel },
  emptySub:   { ...Typography.subheadline, color: Colors.tertiaryLabel, textAlign: 'center' },
});
