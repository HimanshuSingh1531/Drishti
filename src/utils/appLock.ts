import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_ATTEMPTS = 3;
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export interface LockStatus {
  isLocked: boolean;
  attemptsLeft: number;
  unlockTimeMs: number | null;
  minutesLeft: number | null;
}

// ─── Get current attempts ───
export async function getAttempts(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem('face_attempts');
    return val ? parseInt(val) : 0;
  } catch {
    return 0;
  }
}

// ─── Get lock time ───
export async function getLockTime(): Promise<number | null> {
  try {
    const val = await AsyncStorage.getItem('lock_time');
    return val ? parseInt(val) : null;
  } catch {
    return null;
  }
}

// ─── Check if locked ───
export async function checkLockStatus(): Promise<LockStatus> {
  const attempts = await getAttempts();
  const lockTime = await getLockTime();

  if (lockTime) {
    const now = Date.now();
    const unlockTime = lockTime + LOCK_DURATION_MS;

    if (now < unlockTime) {
      const minutesLeft = Math.ceil((unlockTime - now) / 60000);
      return {
        isLocked: true,
        attemptsLeft: 0,
        unlockTimeMs: unlockTime,
        minutesLeft,
      };
    } else {
      // Lock expired — reset
      await resetAttempts();
      return {
        isLocked: false,
        attemptsLeft: MAX_ATTEMPTS,
        unlockTimeMs: null,
        minutesLeft: null,
      };
    }
  }

  return {
    isLocked: false,
    attemptsLeft: MAX_ATTEMPTS - attempts,
    unlockTimeMs: null,
    minutesLeft: null,
  };
}

// ─── Record failed attempt ───
export async function recordFailedAttempt(): Promise<LockStatus> {
  const attempts = (await getAttempts()) + 1;
  await AsyncStorage.setItem('face_attempts', String(attempts));

  if (attempts >= MAX_ATTEMPTS) {
    const lockTime = Date.now();
    await AsyncStorage.setItem('lock_time', String(lockTime));
    return {
      isLocked: true,
      attemptsLeft: 0,
      unlockTimeMs: lockTime + LOCK_DURATION_MS,
      minutesLeft: 5,
    };
  }

  return {
    isLocked: false,
    attemptsLeft: MAX_ATTEMPTS - attempts,
    unlockTimeMs: null,
    minutesLeft: null,
  };
}

// ─── Reset on success ───
export async function resetAttempts(): Promise<void> {
  await AsyncStorage.removeItem('face_attempts');
  await AsyncStorage.removeItem('lock_time');
}