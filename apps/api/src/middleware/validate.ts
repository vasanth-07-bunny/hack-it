import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    req.body = result.data;
    next();
  };
};

// Zod Schemas for API Endpoints
export const RegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address format'),
  collegeOrCompany: z.string().optional().default('Independent Innovator'),
  skills: z.array(z.string()).optional().default(['Full-Stack Dev']),
  preferredRole: z.string().optional().default('Hacker'),
  tShirtSize: z.enum(['S', 'M', 'L', 'XL', 'XXL']).optional().default('L'),
  dietaryRequirements: z.string().optional().default('None')
});

export const CheckInVerifySchema = z.object({
  qrToken: z.string().min(10, 'QR token is required and must be valid'),
  method: z.enum(['onsite_qr_scan', 'virtual_self_checkin', 'organizer_override']).optional().default('onsite_qr_scan'),
  scannedByUserId: z.string().optional()
});

export const CreateTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(50),
  pitch: z.string().min(5, 'Pitch must be at least 5 characters').max(300),
  track: z.string().min(2, 'Track is required'),
  leaderId: z.string().min(1, 'Leader ID is required'),
  openRoles: z.array(z.string()).optional().default([]),
  neededSkills: z.array(z.string()).optional().default([])
});

export const JoinTeamSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  roleInTeam: z.string().optional()
});

export const LockTeamSchema = z.object({
  isLocked: z.boolean().optional().default(true)
});

export const SubmitProjectSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  title: z.string().min(2, 'Project title is required').max(100),
  description: z.string().min(5, 'Project description is required').max(2000),
  track: z.string().optional(),
  repoUrl: z.string().url('Repo URL must be a valid URL'),
  demoUrl: z.string().optional().default(''),
  pitchDeckUrl: z.string().optional().default('')
});

export const CriterionScoreSchema = z.object({
  criterionId: z.string().min(1),
  score: z.number().min(0).max(10)
});

export const SubmitScoreSchema = z.object({
  submissionId: z.string().min(1, 'Submission ID is required'),
  judgeId: z.string().min(1, 'Judge ID is required'),
  criteriaScores: z.array(CriterionScoreSchema).min(1, 'At least one criterion score is required'),
  feedbackStrengths: z.string().optional().default(''),
  feedbackImprovements: z.string().optional().default('')
});

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(2, 'Announcement title is required').max(150),
  message: z.string().min(3, 'Announcement message is required').max(1000),
  severity: z.enum(['info', 'warning', 'urgent']).optional().default('info'),
  targetAudience: z.enum(['all', 'track', 'team']).optional().default('all'),
  targetTrack: z.string().optional(),
  isPinned: z.boolean().optional().default(false),
  authorId: z.string().optional(),
  authorName: z.string().optional()
});
