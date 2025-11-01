import functions from 'firebase-functions'
import admin from 'firebase-admin'

admin.initializeApp()

export const inviteStaff = functions.https.onCall(async (data, context) => {
  // 1. Authentication Check (Unchanged)
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to invite staff.',
    )
  }

  const adminUid = context.auth.uid
  const newStaffEmail = data.email
  const newStaffRole = data.role // <-- FIX: Get the role from the data payload

  // 2. Permission Check
  const db = admin.firestore()
  const adminProfileRef = db.collection('users').doc(adminUid).collection('profiles').doc(adminUid)
  const adminProfileSnap = await adminProfileRef.get()

  // FIX: A more robust check to ensure the person inviting is actually an admin.
  if (!adminProfileSnap.exists || adminProfileSnap.data().role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You must be an admin to invite staff.',
    )
  }

  const pharmacyId = adminProfileSnap.data().pharmacyId
  const pharmacyName = adminProfileSnap.data().name

  // 3. Find user and set their role
  try {
    const staffUserRecord = await admin.auth().getUserByEmail(newStaffEmail)

    // FIX: Use the role from the data payload in the custom claims.
    await admin.auth().setCustomUserClaims(staffUserRecord.uid, {
      role: newStaffRole,
      pharmacyId: pharmacyId,
    })

    // 4. Create Profile for Staff
    const staffProfileRef = db
      .collection('users')
      .doc(staffUserRecord.uid)
      .collection('profiles')
      .doc(staffUserRecord.uid)

    await staffProfileRef.set({
      userId: staffUserRecord.uid,
      pharmacyId: pharmacyId,
      role: newStaffRole, // <-- FIX: Save the correct role in their profile
      name: staffUserRecord.displayName || 'New Staff', // Use their display name or a default
      pharmacyName: pharmacyName, // Add the pharmacy name to their profile
      // Pre-fill location details from the admin's profile
      province: adminProfileSnap.data().province || '',
      district: adminProfileSnap.data().district || '',
      city: adminProfileSnap.data().city || '',
      tole: adminProfileSnap.data().tole || '',
      syncStatus: 'synced',
    })

    return {
      status: 'success',
      message: `Successfully invited ${newStaffEmail} as a ${newStaffRole}.`,
    }
  } catch (error) {
    console.error('Error inviting staff:', error)
    if (error.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError(
        'not-found',
        `User with email ${newStaffEmail} does not have an account yet. Please ask them to sign up first.`,
      )
    }
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while processing the invitation.',
    )
  }
})
