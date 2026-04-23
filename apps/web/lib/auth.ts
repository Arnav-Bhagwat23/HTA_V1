import { SessionStatus } from '@prisma/client';
import { NextRequest } from 'next/server';

import { prisma } from './prisma';

const SESSION_COOKIE_NAME = 'hta_session';

export interface AuthenticatedUser {
  sessionId: string;
  userId: string;
}

export const getSessionToken = (request: NextRequest): string | null => {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value?.trim();
  return token && token.length > 0 ? token : null;
};

export const getAuthenticatedUser = async (
  request: NextRequest,
): Promise<AuthenticatedUser | null> => {
  const tokenHash = getSessionToken(request);

  if (!tokenHash) {
    return null;
  }

  const session = await prisma.session.findFirst({
    where: {
      tokenHash,
      status: SessionStatus.ACTIVE,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          isActive: true,
        },
      },
    },
  });

  if (!session?.user || !session.user.isActive) {
    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastAccessedAt: new Date() },
  });

  return {
    sessionId: session.id,
    userId: session.user.id,
  };
};
