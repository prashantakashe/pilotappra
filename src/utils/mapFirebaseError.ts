// src/utils/mapFirebaseError.ts
export const mapFirebaseError = (errorCode: string): string => {
  const errorMap: { [key: string]: string } = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password is too weak. Please use a stronger password.',
    'auth/operation-not-allowed': 'Email/password authentication is not enabled.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
  };

  return errorMap[errorCode] || 'An error occurred. Please try again.';
};
