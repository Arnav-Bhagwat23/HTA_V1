import { randomUUID } from 'node:crypto';

import { SessionStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '../../../../lib/prisma';

const SESSION_COOKIE_NAME = 'hta_session';

const isDevSessionEnabled = (): boolean =>
  process.env.NODE_ENV !== 'production';

export async function POST(_request: NextRequest) {
  if (!isDevSessionEnabled()) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const standardEmail = process.env.STANDARD_USER_EMAIL?.trim() || 'user@hta.local';
  const sessionToken = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  const user = await prisma.user.findUnique({
    where: { email: standardEmail },
    select: { id: true, isActive: true },
  });

  if (!user?.isActive) {
    return NextResponse.json(
      {
        error:
          `Seeded standard user ${standardEmail} was not found. Run npm run prisma:seed first.`,
      },
      { status: 400 },
    );
  }

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: sessionToken,
      status: SessionStatus.ACTIVE,
      expiresAt,
    },
  });

  const response = NextResponse.json(
    {
      ok: true,
      userEmail: standardEmail,
      expiresAt: expiresAt.toISOString(),
    },
    { status: 201 },
  );

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return response;
}
