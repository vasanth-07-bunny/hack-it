import { Router } from 'express';
import { store } from '../db/store.js';
import { Registration, CheckInRecord, User } from '@abhiyantrix/shared-types';
import { broadcastCheckInUpdate } from '../sockets/index.js';

export const checkinsRouter = Router({ mergeParams: true });

// Public / Attendee Registration
checkinsRouter.post('/register', (req, res) => {
  const eventId = req.params.id as string;
  const event = store.events.get(eventId);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const { fullName, email, collegeOrCompany, skills, preferredRole, tShirtSize, dietaryRequirements } = req.body;
  if (!fullName || !email) {
    return res.status(400).json({ error: 'Full name and email are required' });
  }

  // Check if user already exists or create new user
  let user = Array.from(store.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    user = {
      id: `usr-p-${Date.now().toString().slice(-6)}`,
      email,
      fullName,
      avatarUrl: `https://api.dicebear.com/8.x/bottts/svg?seed=${encodeURIComponent(fullName)}`,
      role: 'participant',
      collegeOrCompany: collegeOrCompany || 'Independent Innovator',
      skills: Array.isArray(skills) ? skills : ['Full-Stack Dev'],
      preferredRole: preferredRole || 'Hacker',
      createdAt: new Date().toISOString()
    };
    store.users.set(user.id, user);
  }

  // Check existing registration
  let registration = Array.from(store.registrations.values()).find(
    r => r.userId === user!.id && r.eventId === eventId
  );

  if (registration) {
    return res.json({
      message: 'Already registered for this event',
      registration,
      qrToken: registration.qrToken,
      user
    });
  }

  const regId = `reg-${user.id}`;
  const qrToken = store.generateQRToken(regId, user.id, eventId);

  registration = {
    id: regId,
    userId: user.id,
    eventId,
    qrToken,
    status: 'registered',
    tShirtSize: tShirtSize || 'L',
    dietaryRequirements: dietaryRequirements || 'None',
    registeredAt: new Date().toISOString(),
    user
  };

  store.registrations.set(registration.id, registration);

  return res.status(201).json({
    message: 'Registration successful! Signed QR Pass generated.',
    registration,
    qrToken,
    user
  });
});

// Get current attendee registration
checkinsRouter.get('/my-registration', (req, res) => {
  const eventId = req.params.id as string;
  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const registration = Array.from(store.registrations.values()).find(
    r => r.userId === userId && r.eventId === eventId
  );

  if (!registration) {
    return res.status(404).json({ error: 'No registration found for this user' });
  }

  const user = store.users.get(userId);
  return res.json({ registration, user });
});

// List all registrations for organizer
checkinsRouter.get('/registrations', (req, res) => {
  const eventId = req.params.id as string;
  const registrations = Array.from(store.registrations.values())
    .filter(r => r.eventId === eventId)
    .map(r => ({
      ...r,
      user: store.users.get(r.userId)
    }));

  return res.json(registrations);
});

// Verify & Process Check-in (via QR Token or Virtual self-checkin)
checkinsRouter.post('/check-in/verify', (req, res) => {
  const eventId = req.params.id as string;
  const { qrToken, method, scannedByUserId } = req.body;

  if (!qrToken) {
    return res.status(400).json({ success: false, error: 'QR Token is missing' });
  }

  // 1. Verify cryptographic HMAC signature
  const verification = store.verifyQRToken(qrToken);
  if (!verification.valid || !verification.registrationId) {
    return res.status(400).json({
      success: false,
      error: verification.error || 'Invalid or Tampered QR Token'
    });
  }

  const registration = store.registrations.get(verification.registrationId);
  if (!registration) {
    return res.status(404).json({ success: false, error: 'Registration record not found' });
  }

  if (registration.eventId !== eventId) {
    return res.status(400).json({ success: false, error: 'QR Code belongs to a different event' });
  }

  const user = store.users.get(registration.userId);

  // 2. Check if already checked in
  if (registration.status === 'checked_in') {
    return res.status(409).json({
      success: false,
      alreadyCheckedIn: true,
      error: `Attendee ${user?.fullName || 'User'} already checked in at ${new Date(registration.checkedInAt!).toLocaleTimeString()}`,
      registration,
      user
    });
  }

  // 3. Mark as checked in
  const checkInMethod = method || 'onsite_qr_scan';
  const checkedInAt = new Date().toISOString();
  registration.status = 'checked_in';
  registration.checkedInAt = checkedInAt;
  registration.checkInMethod = checkInMethod;

  const checkInRecord: CheckInRecord = {
    id: `chk-${Date.now()}`,
    registrationId: registration.id,
    eventId,
    userId: registration.userId,
    scannedByUserId: scannedByUserId || 'usr-org-1',
    method: checkInMethod,
    checkedInAt,
    user
  };

  store.checkIns.set(checkInRecord.id, checkInRecord);

  // Calculate totals and broadcast live update
  const totalRegistered = Array.from(store.registrations.values()).filter(r => r.eventId === eventId).length;
  const totalCheckedIn = Array.from(store.checkIns.values()).filter(c => c.eventId === eventId).length;

  broadcastCheckInUpdate(eventId, totalCheckedIn, totalRegistered, checkInRecord);

  return res.json({
    success: true,
    message: `Verification Successful! Welcome ${user?.fullName}`,
    registration,
    user,
    checkInRecord,
    checkedInAt
  });
});

// Get Check-in Stats
checkinsRouter.get('/check-in/stats', (req, res) => {
  const eventId = req.params.id as string;
  const totalRegistered = Array.from(store.registrations.values()).filter(r => r.eventId === eventId).length;
  const checkIns = Array.from(store.checkIns.values())
    .filter(c => c.eventId === eventId)
    .sort((a, b) => new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime());

  const totalCheckedIn = checkIns.length;
  const recentCheckIns = checkIns.slice(0, 10).map(c => ({
    ...c,
    user: store.users.get(c.userId)
  }));

  return res.json({
    totalRegistered,
    totalCheckedIn,
    checkInRate: totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0,
    recentCheckIns
  });
});
